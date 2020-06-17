---
layout: post
title:  "Detail Button to Lighting Web Component"
date:   2020-06-17 12:00:00 -0400
categories: salesforce lwc
comments: true
---

This tutorial shows you how to open a Lightning Web Component from a detail page button on a record's home page. You can download the code from [my Githup repo](https://github.com/jduelfer/detail-button-to-lwc) and deploy it directly to a fresh scratch org (instructions included): [https://github.com/jduelfer/detail-button-to-lwc](https://github.com/jduelfer/detail-button-to-lwc).

I will demonstrate how to pass the record's context (i.e. the record ID) as a URL parameter to collect within the LWC JavaScript controller. Here is what you will have at the end of the tutorial:
![detail button](/assets/img/detail-button.png)

The button navigates to the LWC with the URL parameter accessible:
![lwc component](/assets/img/lwc-component.png)

## The Aura Component
Unfortnuately, LWCs are not yet accessible via a URL. They might be soon, but in the meantime (there is no release roadmap that I know about) we have a workaround: wrap the LWC within an Aura component.

In order to pass parameters to Aura components, they have to be URL _addressable_.
```
<aura:component implements="force:appHostable, lightning:isUrlAddressable" >
	<p>My component!</p>
</aura:component>
```

This allows the component to have a unique URL and to accept URL parameters. Following [the documentation for lightning:isUrlAddressable](https://developer.salesforce.com/docs/component-library/bundle/lightning:isUrlAddressable/documentation), there is a default `pageReference` attribute loaded into the component by Salesforce magic.

Within the `pageReference` object, we will find the `state` and the parameters that are passed in the URL. Our JavaScript controller could therefore look like this:
```javascript
({
    init : function(cmp, event, helper) {
        var pageRef = cmp.get("v.pageReference").state.c__recordId;
    }
})
```
**Note** that the `c__` prefix seems to be required to distinguish from Salesforce's default parameters.

Thinking about what we will do next, we know we will want to pass the record ID into the final LWC. So, we should set an attribute in the html that can be referenced via Aura's markup. Our HTML could look like:
```html
<aura:component implements="force:appHostable, lightning:isUrlAddressable" >
    <aura:attribute name="recordId" type="String"/>
    <aura:handler name="init" value="this" action="{!c.init}"/>
</aura:component>
```

With the JavaScript controller:
```javascript
({
    init : function(cmp, event, helper) {
        cmp.set("v.recordId", cmp.get("v.pageReference").state.c__recordId);
    }
})
```

## Caching
When I first wrote this code, I was getting a bizarre caching experience. When I clicked on the button the first time, the Aura and LWC would load perfectly. However, when I navigated to a different record and clicked on the button again, I was presented with the old, stale data from the previous button!

I came across the solution to this [in this StackExchange post](https://salesforce.stackexchange.com/questions/257444/disable-caching-in-lwc). The idea is to add a change handler to the `pageReference` object and refresh the view whenever it changes. This will prevent showing stale data.

The resulting HTML looks like this:
```html
<aura:component implements="force:appHostable, lightning:isUrlAddressable" >
    <aura:attribute name="recordId" type="String"/>
    <aura:handler name="init" value="this" action="{!c.init}"/>
    <aura:handler name="change" value="{!v.pageReference}" action="{!c.onPageReferenceChanged}" />
</aura:component>
```

And the resulting JavaScript:
```javascript
({
    init : function(cmp, event, helper) {
        cmp.set("v.recordId", cmp.get("v.pageReference").state.c__recordId);
        },
    onPageReferenceChanged : function(cmp, event, helper) {
        cmp.set("v.recordId", cmp.get("v.pageReference").state.c__recordId);
        $A.get('e.force:refreshView').fire();
    }
})
```
**Note** the `e:force:refreshView` function being called.

## Detail Page button
You can add the detail page button through the interface or just adding this `xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<WebLink xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>MyComponent</fullName>
    <availability>online</availability>
    <description>Navigates to my component Aura page wrapper with an LWC inside.</description>
    <displayType>button</displayType>
    <encodingKey>UTF-8</encodingKey>
    <hasMenubar>false</hasMenubar>
    <hasScrollbars>true</hasScrollbars>
    <hasToolbar>false</hasToolbar>
    <height>600</height>
    <isResizable>true</isResizable>
    <linkType>url</linkType>
    <masterLabel>MyComponent</masterLabel>
    <openType>newWindow</openType>
    <position>none</position>
    <protected>false</protected>
    <showsLocation>false</showsLocation>
    <showsStatus>false</showsStatus>
    <url>/lightning/cmp/c__DetailButtonRouter?c__recordId={!Opportunity.Id}</url>
</WebLink>
```

**Note** that the most important line is `<url>/lightning/cmp/c__DetailButtonRouter?c__recordId={!Opportunity.Id}</url>`. I named by Aura component `DetailButtonRouter`. You can name it whatever you prefer, just make sure to change this line. Also, I'm adding it to the Opportunity layout, so I passed the Opportunity ID with `c__recordId={!Opportunity.Id}`. You can change that to whatever object you need to use.

Add this button to whatever layout you need to.

## LWC
Now that we have a good infrastructure, we need to add our Lightning Web Component that will have the core of our business logic. It may seem annoying to add the wrapping Aura component, but once you have done it, it's really easy to duplicate. The LWC framework is a million times better than Aura and will be the way components are written for the foreseeable future in Salesforce. So, to me, it's worth the few extra lines of code.

We know that we need the record ID from the Aura Component. Therefore, we must _expose_ a property on the LWC controller to be set by the parent component. It would look like this:
```javascript
import { LightningElement, api } from 'lwc';

export default class MyComponent extends LightningElement {

    @api recordId;

}
```

We can then access that property in the HTML:
```html
<template>
    <lightning-card title="My Component">
        <p class="slds-p-horizontal_small">URL parameter: {recordId}</p>
    </lightning-card>
</template>
```

Now, we just need to hookup this LWC from within the parent Aura component:
```html
<aura:component implements="force:appHostable, lightning:isUrlAddressable" >
    <aura:attribute name="recordId" type="String"/>
    <aura:handler name="init" value="this" action="{!c.init}"/>
    <aura:handler name="change" value="{!v.pageReference}" action="{!c.onPageReferenceChanged}" />
    <c:myComponent recordId="{!v.recordId}"/>
</aura:component>
```

## Conclusion
That's it! You can now write an awesome Lightning Web Component for your users. The full code can be cloned here: [https://github.com/jduelfer/detail-button-to-lwc](https://github.com/jduelfer/detail-button-to-lwc).

Leave any comments or suggestions below!
