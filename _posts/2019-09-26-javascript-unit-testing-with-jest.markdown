---
layout: post
title:  "JavaScript Unit Testing with Jest"
date:   2019-09-26 12:00:00 -0400
categories: sfdx lwc unit test jest
---

With the new Lightning Web Component framework, Salesforce included a JavaScript testing framework that blends functional and unit tests. [The Salesforce Documentation on Testing Lightning Web Components](https://developer.salesforce.com/docs/component-library/documentation/lwc/testing) details how to setup this framework and write a few basic, _functional_ tests. It currently lacks examples for _unit_ testing. This guide offers a straightforward example for understanding how to write them.

Salesforce provides us with the following code as an example of a _functional_ test:
```javascript
// hello.test.js
import { createElement } from 'lwc';
import Hello from 'c/hello';

describe('c-hello', () => {
    afterEach(() => {
        // The jsdom instance is shared across test cases in a single file so reset the DOM
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('displays greeting', () => {
        // Create element
        const element = createElement('c-hello', {
            is: Hello
        });
        document.body.appendChild(element);

        // Verify displayed greeting
        const div = element.shadowRoot.querySelector('div');
        expect(div.textContent).toBe('Hello, World!');
    });
});
```
I am roughly considering this to be a _functional_ test because it only cares about how the interface renders data. It isn't really concerned with how `Hello, World!` is computed.

### Extending the example
It's often the case that our components do more things than simply display information. For example, imagine that this component dynamically displays the name of the user and has an input form that performs some sort of validation:
```html
<!-- hello.html -->
<template>
    <div>Hello, {firstName}!</div>
    <lightning-record-edit-form object-api-name="Contact" onsubmit={handleContactSubmit}>
        <div class="slds-grid slds-wrap">
            <div class="slds-col slds-size_1-of-2">
                <lightning-input-field field-name="FirstName" value={firstName}></lightning-input-field>
            </div>
            <div class="slds-col slds-size_1-of-2">
                <lightning-input-field field-name="LastName" value={lastName}></lightning-input-field>
            </div>
            <div class="slds-col slds-size_1-of-2">
                <lightning-input-field field-name="Email" value={email}></lightning-input-field>
            </div>
            <div class="slds-col slds-size_1-of-2">
                <lightning-input-field field-name="Phone" value={phone}></lightning-input-field>
            </div>
            <lightning-button variant="brand" label="Save" type="submit"></lightning-button>
        </div>
    </lightning-record-edit-form>
</template>
```
```javascript
// hello.js
import { LightningElement, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class Hello extends LightningElement {

    // accepts possible values to default
    @api firstName;
    @api lastName;
    @api email;
    @api phone;

    // hook called on component creation
    connectedCallback() {
        if (!this.firstName) {
            this.firstName = 'World';
        }
    }

    handleContactSubmit() {
        const data = this.collectData();
        if (data.criticalError) {
            this.dispatchEvent(new ShowToastEvent({
                title: 'OMG',
                message: data.criticalError,
                variant: 'error'
            }));
        } else {
            // @TODO: save to database
        }
    }

    collectData() {
        const newContact = {};
        this.template.querySelectorAll('lightning-input-field').forEach(field => {
            if (field.fieldName === 'Email' && /\d/.test(field.value)) {
                newContact.criticalError = 'Does your email address really have a number in it? What year is it?';
            } else {
                newContact[field.fieldName] = field.value;
            }
        });
        return newContact;
    }
}
```
This component could sit in a landing page where we could default the contact's information from a parent component or through URL parameters. Let's test the case that we default the contact's first name:
```javascript
it('displays modified name', () => {
    const element = createElement('c-hello', { is: Hello });
    element.firstName = 'Moon';
    document.body.appendChild(element);

    const div = element.shadowRoot.querySelector('div');
    expect(div.textContent).toBe('Hello, Moon!');
});
```
This test checks that the `firstName` property is defaulted and displayed correctly in the interface. However, it still resembles a _functional_ test more than a _unit_ test. The most complex part of my code, and probably the most prone to errors/bugs, would be the `collectData` function. How can I write a unit test to cover this functionality?

## @api Annotation
The `@api` annotation added to the `firstName`, `lastName`, `email`, and `phone` properties on the JavaScript controller allows them to be exposed to other components and, specifically in our case, JavaScript tests. Adding the same annotation to the controller's functions exposes them to tests as well.
```javascript
@api
collectData() {
    // function implementation
}
```
Once annotated with `@api`, I can call the function from tests:
```javascript
it('collects data correctly', () => {
    const element = createElement('c-hello', { is: Hello });
    element.firstName = 'Moon';
    element.lastName = 'Man';
    element.email = 'test@gmail.com';
    element.phone = '222-222-2222';
    document.body.appendChild(element);

    // wait for the component to "render"
    return Promise.resolve().then(() => {
        let contactData = element.collectData();
        expect(contactData.criticalError).toBeUndefined();
        expect(contactData.FirstName).toBe('Moon');
        expect(contactData.LastName).toBe('Man');
        expect(contactData.Email).toBe('test@gmail.com');
        expect(contactData.Phone).toBe('222-222-2222');
    });
});

it('finds error collecting data', () => {
    const element = createElement('c-hello', { is: Hello });
    element.firstName = 'Moon';
    element.lastName = 'Man';
    element.email = 'test245@gmail.com'; // contains numbers
    element.phone = '222-222-2222';
    document.body.appendChild(element);

    return Promise.resolve().then(() => {
        let contactData = element.collectData();
        expect(contactData.criticalError).toBeDefined();
    });
});
```
### Conclusion
By extending the example test that Salesforce provides in their tutorials and simply adding the `@api` annotation to functions on the component's JavaScript controller, we wrote unit tests to ensure the functionality of our component. Now, between LWC and Apex testing, we can be more confident that our custom components will behave as we expect them to. These tests can also be add to Continuous Integration strategies, which I will detail in an upcoming post.