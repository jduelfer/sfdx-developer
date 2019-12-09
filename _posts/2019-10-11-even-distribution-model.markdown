---
layout: post
title:  "Campaign Influence: Even Distribution Model"
date:   2019-12-09 15:00:00 -0400
categories: marketing campaigns
comments: true
---

Salesforce comes out-of-the-box with powerful features to track campaigns and the influence they exert on opportunities. By simply enabling a set of features and adding a couple related lists to the Campaign layout, marketing teams can dive into the data that will help them understand and analyze the effectiveness of their campaigns.

![Campaign Influence](/assets/img/campaign-influence.png)

In this tutorial, we will not cover the standard setup, which is detailed in the [Salesforce Documentation](https://help.salesforce.com/articleView?id=campaigns_influence_customizable_intro.htm&type=5). We are concerned with changing the default **Primary Campaign Source** model to use an **Even Distribution Model**, as the documentation on how to configure this is ambiguous:

> Customizable Campaign Influence includes a Primary Campaign Source revenue attribution model. The Primary Campaign Source model attributes 100% revenue credit to the primary campaign on an opportunity and 0% to any other campaigns that users assign to the opportunity. If you’d like to have more flexibility in how revenue is attributed to campaigns, you or your partners can create custom attribution models.

From this wording, it seems at first that we might have to develop a custom attribution model, but there is actually a standard Even Distribution Model that we can enable!

### Even Distribution Model
Before jumping into how to configure this model, it's important to understand exactly how the Even Distribution Model works to ensure that your clients/coworkers get what they really need.

Say for example that we launch two campaigns. Campaign Members from each Campaign are added as **Opportunity Contact Roles** on a single Opportunity. The Opportunity's _Influenced Campaigns_ related list may look something like this:
![Related List](/assets/img/related-list.png)

If there are two Campaigns influencing a single Opportunity, we can determine that each Campaign's Influence is 50%. Then, for each Campaign Member that exists as an Opportunity Contact Role on the Opportunity, _their_ Influence is a proportion of _their compaign's influence_. So in this scenario, if there are two Campaign Members within a Campaign that has 50% Influence, and those members exist as Opportunity Contact Roles on the incluenced Opportunity, those members will have an Influence of **25%**.

### How To Set It Up
Once the Campaign Influence has been enabled, we also have to enable the **Additional Campaign Influence Models**. This option will appear after Salesforce has finished enabling the standard model. Make sure to refresh the page:
![Additional Influence Models](/assets/img/additional-influence-models.png)

After enabling the additional campaign influence models, if we navigate to `Setup > Feature Settings > Marketing > Campaign Influence > Model Settings`, a new set of models will automatically appear. Our last step is to simply set the new **Event Distribution Model** as the default. The result will look like the following:

![Result](/assets/img/result-models.png)

### Conclusion
Although the official documentation is somewhat ambiguous, setting up an Even Distribution Model is really just as simple as a couple clicks. Using this same process, you can also enable First or Last Touch models. Your client or marketing team will be able to effectively use Salesforce's campaign objects with whichever model best fits their needs.
