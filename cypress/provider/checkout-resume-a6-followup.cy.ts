// Opt-in actual sandbox coverage. Run only with the guarded follow-up runner/config.
// Payment confirmation, Stripe.js/Elements, HTTP authorization and webhooks are real.
describe('A6 follow-up abandoned authentication recovery',()=>{
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
  function openPayment(card:string, fresh=true){
    if(fresh){
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
    } else cy.visit('/basket');
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
  it('resumes the retained unpaid browser-abandoned attempt and verifies its original payment',()=>{
    let checkout='',intent='';let creations=0;
    cy.intercept('POST','**/api/checkout',req=>{creations++;req.continue();});
    cy.intercept('POST','**/api/checkout/*/resume').as('resume');
    cy.task('a6AbandonedSession',null,{log:false}).then((data:any)=>{
      checkout=data.checkout;intent=data.intent;
      cy.visit('/basket',{onBeforeLoad(win){
        win.localStorage.clear();win.sessionStorage.clear();
        win.localStorage.setItem('token',JSON.stringify(data.token));win.localStorage.setItem('basket_id',JSON.stringify(data.basketId));
        win.localStorage.setItem('ls-lang',JSON.stringify({code:'en',dir:'ltr',source:'user'}));
        const consent=JSON.stringify({value:true,expires:Date.now()+3600000});win.localStorage.setItem('cookie_consent',consent);win.localStorage.setItem('stripe_consent',consent);
        win.localStorage.setItem(data.storageKey,JSON.stringify({requestKey:data.requestKey,checkoutId:data.checkout,fingerprint:JSON.stringify(data.input)}));
      }});
    });
    openPayment('4000000000003220',false);cy.contains('button',/Submit order/i).click();
    cy.wait('@resume').then(({response})=>{expect(response!.statusCode).eq(200);expect(response!.body.id).eq(checkout);});
    cy.document({timeout:30000}).should(doc=>{
      expect(allDocuments(doc).slice(1).flatMap(d=>Array.from(d.querySelectorAll('button'))).find(b=>/complete|authorize/i.test(b.textContent||''))).to.exist;
    }).then(doc=>{
      const button=allDocuments(doc).slice(1).flatMap(d=>Array.from(d.querySelectorAll('button'))).find(b=>/complete|authorize/i.test(b.textContent||''))!;cy.wrap(button,{log:false}).click();
    });
    cy.location('pathname',{timeout:120000}).should('eq','/checkout/success');
    cy.then(()=>cy.task('a6Effects',{checkout,label:'abandon-resumed-fulfilled'},{log:false})).then((s:any)=>{
      expect(s.State).eq('PaymentVerified');expect(s.PaymentIntentId).eq(intent);expect(s.attempts).eq(1);
      expect(s.handoffs).eq(1);expect(s.invoices).eq(1);expect(s.mailIntents).eq(1);expect(s.lineEffects).eq(1);
    });
    cy.then(()=>expect(creations).eq(0));
  });
});
