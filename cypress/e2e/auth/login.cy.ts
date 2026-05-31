describe('Login Feature', () => {
  beforeEach(() => {
    cy.visit('/account/login');
  });

  it('should enforce form validation rules by disabling the sign-in button initially', () => {
    cy.get('[data-cy="submit-button"]').should('be.disabled');
  });

  it('should enable the sign-in button only when valid input data is provided', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.loginUser;

      cy.typeInAppInput('email', user.email);
      cy.typeInAppInput('password', user.password);

      cy.get('[data-cy="submit-button"]').should('not.be.disabled');
    });
  });

  it('should navigate to the forgot password route when clicking the corresponding link', () => {
    cy.get('[data-cy="forgot-password-link"]').click();
    cy.location('pathname').should('eq', '/account/forgot-password');
  });

  it('should successfully submit valid credentials and redirect the user to the shop dashboard', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.loginUser;

      cy.intercept('POST', '/api/account/login', {
        statusCode: 200,
        body: { token: user.token, email: user.email }
      }).as('loginRequest');

      cy.loginViaUI(user.email, user.password);
      cy.wait('@loginRequest');

      cy.location('pathname').should('eq', '/shop');
    });
  });
});
