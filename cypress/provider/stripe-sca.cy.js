describe('A6 provider-hosted test authentication',()=>{
  it('completes the real provider test challenge after a server-confirmed test PaymentIntent',()=>{
    cy.task('a6Sca',null,{log:false}).then(data=>{
      cy.origin('https://hooks.stripe.com',{args:{url:data.url}},({url})=>{
        cy.visit(url,{log:false});
        function authorization(doc) {
          const button=[...doc.querySelectorAll('button,input[type=submit],a')].find(el=>/authorize.*test|complete.*authentication/i.test(el.innerText||el.value||''));
          if(button) return button;
          for(const iframe of doc.querySelectorAll('iframe')) {
            try { const result=iframe.contentDocument && authorization(iframe.contentDocument); if(result)return result; } catch {}
          }
          return null;
        }
        cy.document({timeout:15000}).should(doc=>expect(authorization(doc),'provider test authorization control').to.exist)
          .then(doc=>cy.wrap(authorization(doc),{log:false}).click({log:false}));
      });
      cy.location('hostname',{timeout:15000}).should('eq','localhost');
    });
  });
});
