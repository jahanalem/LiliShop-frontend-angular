export interface IProductCharacteristic {
  id       : number,
  sizeId   : number,
  sizeName : string,
  quantity : number,
  productId: number
}

export interface ISizeClassification {
  id      : number,
  size    : string,
  isActive: boolean
}
