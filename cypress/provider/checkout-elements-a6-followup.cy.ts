// Opt-in actual sandbox coverage. Run only with the guarded follow-up runner/config.
// Payment confirmation, Stripe.js/Elements, HTTP authorization and webhooks are real.
describe('A6 follow-up customer Elements authentication',()=>{
  function allDocuments(doc: Document): Document[] {
    const docs=[doc];
    for(const frame of Array.from(doc.querySelectorAll('iframe'))){
      try {if(frame.contentDocument) docs.push(...allDocuments(frame.contentDocument));}catch{}
    }
    return docs;
  }
  function fillFrame(selector:string,value:string){
    cy.get('app-checkout-payment iframe',{timeout:20000}).should('have.length.at.least',3);
    cy.document().should(doc=>{
      const element=allDocuments(doc).map(d=>d.querySelector(selector)).find(Boolean);
      expect(element,`real Stripe field ${selector}`).to.exist;
    }).then(doc=>{
      const element=allDocuments(doc).map(d=>d.querySelector(selector)).find(Boolean)!;
      cy.wrap(element,{log:false}).type(value,{log:false});
    });
  }
  function openPayment(card:string){
    cy.task('a6Session','owner',{log:false}).then((session:any)=>{
      cy.task('a6Basket',null,{log:false}).then((data:any)=>{
        cy.visit('/basket',{onBeforeLoad(win){
          win.localStorage.clear();win.sessionStorage.clear();
          win.localStorage.setItem('token',JSON.stringify(session.token));
          win.localStorage.setItem('basket_id',JSON.stringify(data.basketId));
          win.localStorage.setItem('ls-lang',JSON.stringify({code:'en',dir:'ltr',source:'user'}));
          const consent=JSON.stringify({value:true,expires:Date.now()+3600000});
          win.localStorage.setItem('cookie_consent',consent);win.localStorage.setItem('stripe_consent',consent);
        }});
      });
    });
    cy.window({timeout:30000}).its('Stripe').should('be.a','function');
    cy.contains('button',/Proceed to checkout/i).click();
    cy.get('app-checkout-address input').should('have.length',6).each((input,index)=>{
      cy.wrap(input).clear().type(['Synthetic','Buyer','Test Street','Test City','Test State','10000'][index]);
    });
    cy.contains('button',/Go to delivery/i).click();
    cy.get('app-checkout-delivery mat-radio-button').first().click();
    cy.contains('button',/Go to review/i).click();
    cy.contains('button',/Go to payment/i).click();
    cy.get('app-checkout-payment input').first().type('Synthetic Buyer');
    fillFrame('input[name="cardnumber"]',card);
    fillFrame('input[name="exp-date"]','1234');
    fillFrame('input[name="cvc"]','123');
    cy.contains('button',/Submit order/i).should('be.enabled');
  }
  it('completes a real required authentication and observes signed server verification',()=>{
    let checkout='';let creates=0;
    cy.intercept('POST','**/api/checkout',req=>{creates++;req.continue();}).as('prepare');
    openPayment('4000000000003220');
    cy.contains('button',/Submit order/i).click();
    cy.wait('@prepare').then(({response})=>{expect(response!.statusCode).eq(200);checkout=response!.body.id;});
    cy.document({timeout:30000}).should(doc=>{
      const buttons=allDocuments(doc).slice(1).flatMap(d=>Array.from(d.querySelectorAll('button')));
      expect(buttons.find(b=>/complete|authorize/i.test(b.textContent||'')),'provider authentication control').to.exist;
    }).then(doc=>{
      const buttons=allDocuments(doc).slice(1).flatMap(d=>Array.from(d.querySelectorAll('button')));
      const button=buttons.find(b=>/complete|authorize/i.test(b.textContent||''))!;
      cy.wrap(button,{log:false}).click();
    });
    cy.location('pathname',{timeout:120000}).should('eq','/checkout/success');
    cy.get('app-checkout-success [role=status]').first().should('contain.text','Payment received');
    cy.then(()=>cy.task('a6Snapshot',{checkout,label:'elements-auth-success'},{log:false})).then((s:any)=>{
      expect(s.State).eq('PaymentVerified');expect(s.attempts).eq(1);expect(s.handoffs).eq(1);
      expect(s.receipts.some((r:any)=>r.ApiVersion==='2026-09-30.endive' && r.EventType==='payment_intent.succeeded')).eq(true);
    });
    cy.reload();
    cy.get('app-checkout-success [role=status]').first().should('contain.text','Payment received');
    cy.then(()=>expect(creates).eq(1));
    cy.then(()=>cy.task('a6Effects',{checkout,label:'elements-auth-fulfilled'},{log:false})).then((s:any)=>{
      expect(s.handoffs).eq(1);expect(s.invoices).eq(1);expect(s.mailIntents).eq(1);expect(s.lineEffects).eq(1);
      expect(s.execution[0].State).eq('Complete');
    });
  });
  it('fails required authentication without inventing payment or fulfillment',()=>{
    let checkout='';
    cy.intercept('POST','**/api/checkout').as('prepare');
    openPayment('4000008400000027');
    cy.contains('button',/Submit order/i).click();
    cy.wait('@prepare').then(({response})=>{expect(response!.statusCode).eq(200);checkout=response!.body.id;});
    cy.document({timeout:30000}).should(doc=>{
      const button=allDocuments(doc).slice(1).flatMap(d=>Array.from(d.querySelectorAll('button'))).find(b=>/fail/i.test(b.textContent||''));
      expect(button,'provider failed-authentication control').to.exist;
    }).then(doc=>{
      const button=allDocuments(doc).slice(1).flatMap(d=>Array.from(d.querySelectorAll('button'))).find(b=>/fail/i.test(b.textContent||''))!;
      cy.wrap(button,{log:false}).click();
    });
    cy.contains(/authenticate|authentication/i,{timeout:30000}).should('be.visible');
    cy.then(()=>cy.task('a6Snapshot',{checkout,label:'elements-auth-failure'},{log:false})).then((s:any)=>{
      expect(s.State).not.eq('PaymentVerified');expect(s.attempts).eq(1);expect(s.handoffs).eq(0);
      expect(s.invoices).eq(0);expect(s.mailIntents).eq(0);expect(s.lineEffects).eq(0);
    });
    cy.then(()=>cy.visit(`/checkout/success?checkout=${checkout}`));
    cy.get('app-checkout-success').should('not.contain.text','Payment received');
    cy.reload();cy.get('app-checkout-success').should('not.contain.text','Payment received');
  });
  it('retains a declined attempt and displays the actual recoverable failure',()=>{
    let checkout='';let creates=0;
    cy.intercept('POST','**/api/checkout',req=>{creates++;req.continue();}).as('prepare');
    openPayment('4000000000000002');
    cy.contains('button',/Submit order/i).click();
    cy.wait('@prepare').then(({response})=>{expect(response!.statusCode).eq(200);checkout=response!.body.id;});
    cy.get('body',{timeout:30000}).should('contain.text','declined');
    cy.then(()=>cy.task('a6Snapshot',{checkout,label:'elements-card-decline'},{log:false})).then((s:any)=>{
      expect(s.State).not.eq('PaymentVerified');expect(s.attempts).eq(1);expect(s.handoffs).eq(0);expect(s.invoices).eq(0);expect(s.lineEffects).eq(0);
    });
    cy.reload();
    cy.get('app-checkout-payment iframe',{timeout:30000}).should('have.length.at.least',3);
    cy.then(()=>expect(creates).eq(1));
  });
});
