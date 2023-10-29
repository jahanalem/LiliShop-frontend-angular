import { Basket, IBasketItem } from './../../shared/models/basket';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { IBasket, IBasketTotals } from 'src/app/shared/models/basket';
import { IDeliveryMethod } from 'src/app/shared/models/deliveryMethod';
import { IProduct } from 'src/app/shared/models/product';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';


@Injectable({
  providedIn: 'root'
})
export class BasketService {
  baseUrl = environment.apiUrl;

  /*
  BehaviorSubject is a special kind of Observable that allows for multicasting of the Observable itself and allows for multiple subscribers to list as well.
  And this is something we're going to make use of for our basket because a basket will need to be accessible by multiple different components.
*/
  private basketSource = new BehaviorSubject<IBasket | null>(null);
  basket$ = this.basketSource.asObservable();
  private basketTotalSource = new BehaviorSubject<IBasketTotals | null>(null);
  basketTotal$ = this.basketTotalSource.asObservable();
  shipping = 0;

  constructor(private http: HttpClient, private storageService: StorageService) {
    this.basketSource.asObservable()
  }

  /**
   * Creates a payment intent for the current basket.
   *
   * This method sends a POST request to the server to initiate a payment
   * for the items in the user's basket. Once the request is successful,
   * the basket is updated with the server's response.
   *
   * @returns {Observable<IBasket>} An Observable that emits the updated basket.
   */
  createPaymentIntent(): Observable<IBasket> {
    // Get the current basket's ID, if available.
    const currentBasketId = this.getCurrentBasketValue()?.id;

    // Ensure we have a basket ID before proceeding.
    if (!currentBasketId) {
      // Handle this scenario appropriately; maybe return an Observable that emits an error.
      return throwError(() => "No basket available to initiate payment.");
    }

    // Construct the URL for the POST request.
    const paymentIntentUrl = `${this.baseUrl}payments/${currentBasketId}`;

    // Execute the POST request and update the basket on success.
    return this.http.post<IBasket>(paymentIntentUrl, {}).pipe(
      tap((updatedBasket: IBasket) => {
        this.basketSource.next(updatedBasket);
      })
    );
  }


  /**
   * Sets the shipping price for the current basket.
   *
   * This method updates the basket with the selected delivery method's
   * price and ID. It then recalculates the basket totals and updates
   * the basket on the server.
   *
   * @param {IDeliveryMethod} deliveryMethod - The selected delivery method.
   */
  setShippingPrice(deliveryMethod: IDeliveryMethod): void {
    // Update the local shipping price
    this.shipping = deliveryMethod.price;

    // Retrieve the current basket
    const currentBasket = this.getCurrentBasketValue();

    // Ensure a basket exists before proceeding
    if (!currentBasket) {
      console.log('No basket available to update shipping price.');
      return;
    }

    // Update the basket with the new delivery method details
    currentBasket.deliveryMethodId = deliveryMethod.id;
    currentBasket.shippingPrice = deliveryMethod.price;

    // Recalculate the basket totals
    this.calculateTotals();

    // Update the basket on the server
    this.setBasket(currentBasket).subscribe({
      next: () => console.log('Basket updated successfully'),
      error: (error) => console.error('An error occurred while updating the basket', error)
    });
  }


  /**
  * Retrieves the basket with the specified ID from the server.
  *
  * This method sends an HTTP GET request to fetch the basket details.
  * Upon a successful response, it updates the local basket state,
  * sets the shipping price, and recalculates the basket totals.
  *
  * @param {string} id - The ID of the basket to retrieve.
  * @returns {Observable<IBasket>} An Observable that emits the retrieved basket.
  */
  getBasket(id: string): Observable<IBasket> {
    // Construct the URL for the GET request.
    const getBasketUrl = `${this.baseUrl}basket?id=${id}`;

    // Execute the GET request and perform updates upon success.
    return this.http.get<IBasket>(getBasketUrl).pipe(
      tap((retrievedBasket: IBasket) => {
        // Update the local basket state with the retrieved basket.
        this.basketSource.next(retrievedBasket);

        // Update the shipping price, defaulting to 0 if not available.
        this.shipping = retrievedBasket.shippingPrice ?? 0;

        // Recalculate the basket totals.
        this.calculateTotals();
      })
    );
  }


  /**
 * Updates or sets the basket on the server.
 *
 * This method sends an HTTP POST request to update or set the basket.
 * On a successful response, it updates the local basket state and
 * recalculates the basket totals.
 *
 * @param {IBasket} basket - The basket object to set or update.
 * @returns {Observable<IBasket>} An Observable that emits the updated basket.
 */
  setBasket(basket: IBasket): Observable<IBasket> {
    // Construct the URL for the POST request
    const setBasketUrl = `${this.baseUrl}basket`;

    // Execute the POST request
    return this.http.post<IBasket>(setBasketUrl, basket).pipe(
      tap((updatedBasket: IBasket) => {
        // Update the local basket state with the updated basket
        this.basketSource.next(updatedBasket);

        // Recalculate the basket totals
        this.calculateTotals();
      }),
      catchError(error => {
        // Log the error and re-throw it for further handling
        console.error('An error occurred while setting the basket:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Gets the current value of the basket from local state.
   *
   * This method returns the current value of the `basketSource`
   * BehaviorSubject, which holds the state of the user's basket.
   *
   * @returns {IBasket | null} The current basket or null if it doesn't exist.
   */
  getCurrentBasketValue(): IBasket | null {
    return this.basketSource.value;
  }


  /**
 * Adds an item to the user's basket or updates its quantity.
 *
 * This method takes a product item and a quantity, then either adds the
 * item to the basket or updates its quantity if it's already in the basket.
 * Finally, it updates the basket on the server.
 *
 * @param {IProduct} item - The product item to add to the basket.
 * @param {number} [quantity=1] - The quantity of the item to add.
 */
  addItemToBasket(item: IProduct, quantity: number = 1): void {
    // Map the product item to a basket item
    const itemToAdd: IBasketItem = this.mapProductItemToBasketItem(item, quantity);

    // Get the current basket or create a new one if none exists
    const currentBasket = this.getCurrentBasketValue() ?? this.createBasket();

    // Add or update the item in the basket
    currentBasket.items = this.addOrUpdateItem(currentBasket.items!, itemToAdd, quantity);

    // Update the basket on the server
    this.setBasket(currentBasket).subscribe({
      next: () => console.log('Basket updated successfully'),
      error: (error) => console.error('An error occurred while updating the basket', error)
    });
  }


  /**
   * Adds a new item to the basket or updates the quantity of an existing item.
   *
   * This private helper method takes an array of basket items, an item to add,
   * and a quantity. It either adds the new item to the array with the given
   * quantity or updates the quantity of the item if it already exists in the array.
   *
   * @private
   * @param {IBasketItem[]} items - The current array of items in the basket.
   * @param {IBasketItem} itemToAdd - The item to add or update in the basket.
   * @param {number} quantity - The quantity of the item to add or update.
   * @returns {IBasketItem[]} The updated array of items in the basket.
   */
  private addOrUpdateItem(items: IBasketItem[], itemToAdd: IBasketItem, quantity: number): IBasketItem[] {
    // Find the index of the item in the current items array
    const itemIndex = items.findIndex(item => item.id === itemToAdd.id);

    // If the item doesn't exist in the array, add it
    if (itemIndex === -1) {
      itemToAdd.quantity = quantity;
      items.push(itemToAdd);
    } else {
      // If the item already exists, update its quantity
      items[itemIndex].quantity += quantity;
    }

    return items;
  }


  /**
 * Creates a new basket and stores its ID in local storage.
 *
 * This private helper method initializes a new Basket object,
 * stores its ID in local storage using the `storageService`, and
 * returns the newly created basket.
 *
 * @private
 * @returns {IBasket} The newly created basket.
 */
  private createBasket(): IBasket {
    // Initialize a new Basket object
    const newBasket = new Basket();

    // Store the new basket's ID in local storage
    this.storageService.set('basket_id', newBasket.id);

    return newBasket;
  }


  /**
 * Maps a product item to a basket item.
 *
 * This private helper method takes a product item and a quantity, then
 * maps them to a basket item object. It fills in default values for
 * brand and type if they are not provided in the product item.
 *
 * @private
 * @param {IProduct} item - The product item to map.
 * @param {number} quantity - The quantity of the item.
 * @returns {IBasketItem} The mapped basket item.
 */
  private mapProductItemToBasketItem(item: IProduct, quantity: number): IBasketItem {
    // Map each property of the product item to the corresponding property of a basket item
    return {
      id: item.id,
      productName: item.name,
      price: item.price,
      pictureUrl: item.pictureUrl,
      quantity,
      brand: item.productBrand ?? "UNKNOWN BRAND",
      type: item.productType ?? "UNKNOWN TYPE"
    };
  }


  /**
  * Calculates and updates the basket totals.
  *
  * This private helper method calculates the basket's subtotal, shipping, and total costs.
  * It then updates the `basketTotalSource` BehaviorSubject with the new totals.
  *
  * @private
  */
  private calculateTotals(): void {
    // Retrieve the current basket
    const currentBasket = this.getCurrentBasketValue();

    // If there's no basket, exit the function
    if (!currentBasket) {
      console.log('No basket available for calculating totals.');
      return;
    }

    // Retrieve the current shipping cost
    const shippingCost = this.shipping;

    // Calculate the subtotal
    const subtotalCost = currentBasket.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Calculate the total cost
    const totalCost = subtotalCost + shippingCost;

    // Update the basket totals
    this.basketTotalSource.next({ shipping: shippingCost, subtotal: subtotalCost, total: totalCost });
  }


  /**
 * Increments the quantity of a given item in the basket.
 *
 * This method takes a basket item and increments its quantity by 1.
 * It calls the `updateItemQuantity` method to perform the actual update.
 *
 * @param {IBasketItem} item - The basket item whose quantity will be incremented.
 */
  incrementItemQuantity(item: IBasketItem): void {
    // Increment the item's quantity by 1
    const newQuantity = item.quantity + 1;

    // Update the item's quantity in the basket
    this.updateItemQuantity(item, newQuantity);
  }


  /**
  * Decrements the quantity of a given item in the basket.
  *
  * This method takes a basket item and decrements its quantity by 1.
  * It calls the `updateItemQuantity` method to perform the actual update.
  *
  * @param {IBasketItem} item - The basket item whose quantity will be decremented.
  */
  decrementItemQuantity(item: IBasketItem): void {
    // Decrement the item's quantity by 1
    const newQuantity = item.quantity - 1;

    // Update the item's quantity in the basket
    this.updateItemQuantity(item, newQuantity);
  }


  /**
 * Removes an item from the basket.
 *
 * This method takes a basket item and sets its quantity to 0,
 * effectively removing it from the basket. It calls the
 * `updateItemQuantity` method to perform the actual update.
 *
 * @param {IBasketItem} item - The basket item to be removed.
 */
  removeItemFromBasket(item: IBasketItem): void {
    // Set the item's quantity to 0 to remove it from the basket
    const newQuantity = 0;

    // Update the item's quantity in the basket
    this.updateItemQuantity(item, newQuantity);
  }


  /**
 * Deletes a basket and clears its associated state.
 *
 * This method sends a DELETE request to remove the specified basket
 * from the server. On successful deletion, it clears the basket and
 * basket totals from local state and removes the basket ID from local storage.
 *
 * @param {IBasket} basket - The basket to delete.
 * @returns {Observable<void>} An observable that emits when the basket is successfully deleted.
 */
  deleteBasket(basket: IBasket): Observable<void> {
    // Build the DELETE request URL
    const deleteUrl = `${this.baseUrl}basket?id=${basket.id}`;

    return this.http.delete<void>(deleteUrl).pipe(
      tap(() => {
        // Clear the basket and basket totals from local state
        this.basketSource.next(null);
        this.basketTotalSource.next(null);

        // Remove the basket ID from local storage
        this.storageService.delete('basket_id');
      }),
      catchError(error => {
        // Log the error and re-throw it
        console.error('Error deleting basket:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Deletes a local basket and clears its associated state.
   *
   * This method removes the basket and basket totals from the local state
   * and deletes the basket ID from local storage.
   */
  deleteLocalBasket(): void {
    // Clear the basket and basket totals from local state
    this.basketSource.next(null);
    this.basketTotalSource.next(null);

    // Remove the basket ID from local storage
    this.storageService.delete('basket_id');
  }


  /**
 * Updates the quantity of a given item in the basket.
 *
 * This private helper method takes a basket item and a new quantity,
 * then updates the item's quantity in the basket. If the new quantity
 * is zero or less, it removes the item from the basket. If the basket
 * becomes empty, it deletes the basket.
 *
 * @private
 * @param {IBasketItem} item - The basket item to update.
 * @param {number} newQuantity - The new quantity for the item.
 */
  private updateItemQuantity(item: IBasketItem, newQuantity: number): void {
    // Retrieve the current basket
    const currentBasket = this.getCurrentBasketValue();

    // If there's no basket, exit the function
    if (!currentBasket) {
      console.log('No basket available for updating item quantity.');
      return;
    }

    // Find the index of the item to update
    const itemIndex = currentBasket.items.findIndex(x => x.id === item.id);

    if (newQuantity > 0) {
      // Update the item's quantity
      currentBasket.items[itemIndex].quantity = newQuantity;
    } else {
      // Remove the item from the basket
      currentBasket.items.splice(itemIndex, 1);

      // If the basket is now empty, delete it
      if (currentBasket.items.length === 0) {
        this.deleteBasket(currentBasket).subscribe({
          next: () => console.log('Basket deleted'),
          error: (error: any) => { console.error('Error deleting basket:', error); },
        });
      }
    }

    // Update the basket
    this.setBasket(currentBasket).subscribe({
      next: () => console.log('Basket updated successfully'),
      error: (error) => console.error('An error occurred while updating basket', error)
    });
  }
}
