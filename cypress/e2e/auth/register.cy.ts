describe('Registration Feature', () => {
  beforeEach(() => {
    cy.visit('/account/register');
  });

  it('should disable the register button by default when the form is empty', () => {
    cy.get('[data-cy="submit-button"]').should('be.disabled');
  });

  it('should display the Google Sign-In container element', () => {
    cy.get('[data-cy="google-signin-btn"]').should('exist');
  });

  it('should keep the register button disabled if passwords do not match', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.mismatchedUser;

      cy.typeInAppInput('display-name-container', user.displayName);
      cy.typeInAppInput('email-container', user.email);
      cy.typeInAppInput('password-container', user.password);
      cy.typeInAppInput('confirm-password-container', user.confirmPassword);

      cy.get('[data-cy="submit-button"]').should('be.disabled');
    });
  });

  it('should enable the register button when all inputs are valid and match', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.matchingFormUser;

      cy.typeInAppInput('display-name-container', user.displayName);
      cy.typeInAppInput('email-container', user.email);
      cy.typeInAppInput('password-container', user.password);
      cy.typeInAppInput('confirm-password-container', user.password);

      cy.get('[data-cy="submit-button"]').should('not.be.disabled');
    });
  });

  it('should submit registration successfully, handle the confirmation dialog, and redirect to the shop', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.validUser;

      cy.intercept('GET', '/api/account/emailexists*', { statusCode: 200, body: false }).as('emailExistsCheck');
      cy.intercept('POST', '/api/account/register', {
        statusCode: 200,
        body: { displayName: user.displayName, email: user.email, token: user.token }
      }).as('registerSuccessRequest');

      cy.typeInAppInput('display-name-container', user.displayName);
      cy.typeInAppInput('email-container', user.email);
      cy.wait('@emailExistsCheck');

      cy.typeInAppInput('password-container', user.password);
      cy.typeInAppInput('confirm-password-container', user.password);

      cy.get('[data-cy="submit-button"]').should('not.be.disabled').click();
      cy.wait('@registerSuccessRequest');

      cy.handleMaterialDialog('Email Confirmation Sent');

      cy.location('pathname').should('eq', '/shop');
    });
  });
});
