describe('Login Feature', () => {
  beforeEach(() => {
    // Navigate to the login page before every test case
    cy.visit('/account/login');
  });

  it('should enforce form validation rules by disabling the sign-in button initially', () => {
    // The form is empty, so the submit button must be disabled
    cy.get('button[type="submit"]').should('be.disabled');
  });

  it('should enable the sign-in button only when valid input data is provided', () => {
    // Target inputs inside your custom <app-text-input> components
    cy.get('app-text-input[formControlName="email"]').find('input').type('user@example.com');
    cy.get('app-text-input[formControlName="password"]').find('input').type('Password123!');

    // The form should now satisfy validation conditions
    cy.get('button[type="submit"]').should('not.be.disabled');
  });

  it('should navigate to the forgot password route when clicking the corresponding link', () => {
    cy.get('.forgot-password a').click();

    // Verify that the router successfully changed the URL path
    cy.url().should('include', '/account/forgot-password');
  });

  it('should successfully submit valid credentials and redirect the user to the shop dashboard', () => {
    // Mock the backend API authentication request to keep tests isolated and fast
    cy.intercept('POST', '/api/account/login', {
      statusCode: 200,
      body: { token: 'mock-jwt-token-string', email: 'user@example.com' }
    }).as('loginRequest');

    // Fill out the login form
    cy.get('app-text-input[formControlName="email"]').find('input').type('user@example.com');
    cy.get('app-text-input[formControlName="password"]').find('input').type('Password123!');

    // Click the submit button
    cy.get('button[type="submit"]').click();

    // Verify that the exact HTTP request was sent to the .NET backend
    cy.wait('@loginRequest');

    // Confirm that the user is redirected away from the login page upon success
    cy.url().should('include', '/shop');
  });
});
