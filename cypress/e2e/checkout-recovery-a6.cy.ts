describe('A6 real HTTP and SQL status/recovery', () => {
  function visitAs(role: string, target: (fixture: any) => string) {
    return cy.task('a6Session', role, {log:false}).then((data: any) => {
      cy.visit(target(data.fixture), {onBeforeLoad(win) {
        win.localStorage.setItem('token',JSON.stringify(data.token));
        win.localStorage.setItem('ls-lang',JSON.stringify({code:'en',dir:'ltr',source:'user'}));
      }});
      return cy.wrap(data.fixture,{log:false});
    });
  }
  it('opens direct checkout status and reloads without another payment request', () => {
    let writes=0;
    cy.intercept('POST','**/api/checkout**', req => {writes++;req.continue();});
    visitAs('owner', f=>`/checkout/success?checkout=${f.checkoutId}`);
    cy.get('app-checkout-success [role=status]').first().should('contain.text','Payment received');
    cy.reload();
    cy.get('app-checkout-success [role=status]').first().should('contain.text','Payment received');
    cy.then(()=>expect(writes).to.eq(0));
  });
  it('another customer receives no payment or processing evidence', () => {
    cy.intercept('GET','**/api/checkout/*').as('status');
    visitAs('other',f=>`/checkout/success?checkout=${f.checkoutId}`);
    cy.wait('@status').its('response.statusCode').should('eq',404);
    cy.get('body').should('not.contain.text','Payment received.');
  });
  it('uses real SuperAdmin revision/reason retry and displays the persisted audit', () => {
    cy.intercept('POST','**/api/fulfillment/*/retry').as('retry');
    visitAs('owner',f=>`/admin/fulfillment/${f.blockedHandoff}`);
    cy.get('#operator-reason').should('be.visible');
    cy.contains('button','Retry processing').should('be.disabled');
    cy.get('#operator-reason').type('A6 browser investigated synthetic failure');
    cy.contains('button','Retry processing').click();
    cy.wait('@retry').its('response.statusCode').should('eq',200);
    cy.get('app-fulfillment').should('contain.text','A6 browser investigated synthetic failure');
    cy.contains('button','Retry processing').should('be.disabled');
  });
  it('anonymous direct status remains protected by the real auth guard', () => {
    cy.clearAllCookies();
    cy.visit('/checkout/success?checkout=00000000-0000-0000-0000-000000000001',{onBeforeLoad(win){win.localStorage.clear();win.sessionStorage.clear();}});
    cy.location('pathname').should('eq','/account/login');
    cy.get('app-checkout-success').should('not.exist');
  });
});
