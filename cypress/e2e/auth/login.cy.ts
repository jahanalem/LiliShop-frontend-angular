describe('Login Feature', () => {
  beforeEach(() => {
    // Navigate to the login page before every test case
    cy.visit('/account/login');
  });

  it('should enforce form validation rules by disabling the sign-in button initially', () => {
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should enable the sign-in button only when valid input data is provided', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.loginUser;

      cy.typeInAppInput('email', user.email);
      cy.typeInAppInput('password', user.password);

      cy.get('button[type="submit"]').should('not.be.disabled');
    });
  });

  it('should navigate to the forgot password route when clicking the corresponding link', () => {
    cy.get('.forgot-password a').click();

    // Verify that the router successfully changed the URL path
    cy.location('pathname').should('eq', '/account/forgot-password');
  });

  it('should successfully submit valid credentials and redirect the user to the shop dashboard', () => {
    cy.fixture('auth-data').then((data) => {
      const user = data.loginUser;

      // Mock the backend API authentication request to keep tests isolated and fast
      cy.intercept('POST', '/api/account/login', {
        statusCode: 200,
        body: { token: user.token, email: user.email }
      }).as('loginRequest');

      // Execute programmatic form submission via custom command
      cy.loginViaUI(user.email, user.password);

      // Verify that the exact HTTP request was sent to the backend
      cy.wait('@loginRequest');

      // Confirm that the user is redirected away from the login page upon success
      cy.location('pathname').should('eq', '/shop');
    });
  });
});
