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
    cy.fixture('auth-data').then((data) => {
      const user = data.mismatchedUser;

      cy.typeInAppInput('displayName', user.displayName);
      cy.typeInAppInput('email', user.email);
      cy.typeInAppInput('password', user.password);
      cy.typeInAppInput('confirmPassword', user.confirmPassword);

      cy.get('button[type="submit"]').should('be.disabled');
    });
  });

  it('should enable the register button when all inputs are valid and match', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.matchingFormUser;

      cy.typeInAppInput('displayName', user.displayName);
      cy.typeInAppInput('email', user.email);
      cy.typeInAppInput('password', user.password);
      cy.typeInAppInput('confirmPassword', user.password);

      cy.get('button[type="submit"]').should('not.be.disabled');
    });
  });

  it('should submit registration successfully, handle the confirmation dialog, and redirect to the shop', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.validUser;

      // 1. Intercept the async email availability check
      cy.intercept('GET', '/api/account/emailexists*', {
        statusCode: 200,
        body: false
      }).as('emailExistsCheck');

      // 2. Intercept the successful registration endpoint
      cy.intercept('POST', '/api/account/register', {
        statusCode: 200,
        body: {
          displayName: user.displayName,
          email: user.email,
          token: user.token
        }
      }).as('registerSuccessRequest');

      // 3. Fill out the form fields and trigger validations via custom command
      cy.typeInAppInput('displayName', user.displayName);
      cy.typeInAppInput('email', user.email);
      cy.wait('@emailExistsCheck');

      cy.typeInAppInput('password', user.password);
      cy.typeInAppInput('confirmPassword', user.password);

      // 4. Submit the form and wait for the network response
      cy.get('button[type="submit"]').should('not.be.disabled').click();
      cy.wait('@registerSuccessRequest');

      // 5. Interact with the Angular Material Dialog via custom command
      cy.handleMaterialDialog('Email Confirmation Sent');

      // 6. Assert that the application routes to the shop after closure
      cy.location('pathname').should('eq', '/shop');
    });
  });
});
