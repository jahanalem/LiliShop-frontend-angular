# LiliShop is the store's e-commerce style.
  website url: https://lili-shop.azurewebsites.net
  
There is pagination as well as filters, allowing users to navigate and filter by specific brands or types.
Additionally, users can search for products.

In addition, there is a breadcrumb navigation bar at the top of the page, and users may simply add items to their basket.

## Serverside:
https://github.com/jahanalem/LiliShop-backend-dotnet

tech stack: .NET 7, C#, Postgresql, Redis, and Entity Framework as an ORM

Redis is utilized to keep the customer's shopping cart in server memory. This is a memory-based data repository. Its primary function in the world is typically for caching. It operates on a key-value pair data structure and is extremely quick and persistent in memory.

Repository and Unit Of Work are implemented, as well as Generic and Specification Pattern.



## Clientside:
https://github.com/jahanalem/LiliShop-frontend-angular

tech stack: Angular, Typescript, and Bootstrap


As a payment services provider that enables merchants to take credit cards, Stripe has been utilized.



This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
