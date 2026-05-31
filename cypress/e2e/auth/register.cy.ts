describe('Registration Feature', () => {
  beforeEach(() => {
    // Navigate to the registration route
    cy.visit('/account/register');
  });

  it('should disable the register button by default when the form is empty', () => {
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should display the Google Sign-In container element', () => {
    cy.get('#buttonDiv').should('exist');
  });

  it('should keep the register button disabled if passwords do not match', () => {
    cy.get('app-text-input[formControlName="displayName"]').find('input').type('John Doe');
    cy.get('app-text-input[formControlName="email"]').find('input').type('john.doe@example.com');
    cy.get('app-text-input[formControlName="password"]').find('input').type('SecurePass123!');

    // Enter a non-matching password
    cy.get('app-text-input[formControlName="confirmPassword"]').find('input').type('DifferentPass123!');

    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should enable the register button when all inputs are valid and match', () => {
    cy.get('app-text-input[formControlName="displayName"]').find('input').type('John Doe');
    cy.get('app-text-input[formControlName="email"]').find('input').type('john.doe@example.com');
    cy.get('app-text-input[formControlName="password"]').find('input').type('SecurePass123!');
    cy.get('app-text-input[formControlName="confirmPassword"]').find('input').type('SecurePass123!');

    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('should submit registration successfully, handle the confirmation dialog, and redirect to the shop', () => {
    // 1. Intercept the async email availability check
    cy.intercept('GET', '/api/account/emailexists*', {
      statusCode: 200,
      body: false
    }).as('emailExistsCheck');

    // 2. Intercept the successful registration endpoint
    cy.intercept('POST', '/api/account/register', {
      statusCode: 200,
      body: {
        displayName: 'John Doe',
        email: 'newuser@example.com',
        token: 'mock-jwt-token'
      }
    }).as('registerSuccessRequest');

    // 3. Fill out the form fields and trigger micro-validations
    cy.get('app-text-input[formControlName="displayName"]').find('input').type('John Doe').blur();
    cy.get('app-text-input[formControlName="email"]').find('input').type('newuser@example.com').blur();
    cy.wait('@emailExistsCheck');

    cy.get('app-text-input[formControlName="password"]').find('input').type('SecurePass123!').blur();
    cy.get('app-text-input[formControlName="confirmPassword"]').find('input').type('SecurePass123!').blur();

    // 4. Submit the form and wait for the successful network response
    cy.get('button[type="submit"]').should('not.be.disabled').click();
    cy.wait('@registerSuccessRequest');

    // 5. Interact with the Angular Material Dialog
    cy.get('mat-dialog-container', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Email Confirmation Sent');

    // Click the confirmation button inside the dialog to close it
    cy.get('mat-dialog-container').find('button').click();

    // 6. Assert that the application routes to the shop after the dialog closes
    cy.location('pathname').should('eq', '/shop');
  });
});
