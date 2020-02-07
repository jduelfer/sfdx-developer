---
layout: post
title:  "Caching Schema Metadata"
date:   2020-02-07 10:30:00 -0400
categories: salesforce apex
comments: true
---

If you use the `Global Metadata Schema` that is provided by Apex to access field labels, record types names, etc., I would wager that you are *not* using it efficiently. But as a seasoned Salesforce developer, you may prove me wrong.

```javascript

public static doTransformation(List<Opportunity> opportunities) {
    for (Opportunity opp : opportunities) {
        if (opp.RecordTypeId == getRecordTypeId('Opportunity', 'example')) {
            opp.Type = 'New';
        }
    }
}

public static getRecordTypeId(String objectName, String recordTypeName) {
    return Schema.getGlobalDescribe().get(objectName).getDescribe().getRecordTypeInfosByName().get(recordTypeName).Id;
}
```

You decided that you _hate_ rewriting `Schema.getGlobal...` every time, so you pulled it into a nice helper function. On the surface, this seems nice and modular and good for code reuse. In reality, you have written unoptimized code that can significantly slow down larger systems.

What do I mean?

The `getRecordTypeId` function calls the global `Schema` class each time it is invoked, and each of the functions `getGlobalDescribe()` and `getRecordTypeInfosByName()` are taking up some serious CPU.

You should access the `Schema` global class as little as possible for every transaction. An optimized version of the code would be the following.

```javascript

public static doTransformation(List<Opportunity> opportunities) {
    String exampleRecordTypeId = getRecordTypeId('Opportunity', 'example');
    for (Opportunity opp : opportunities) {
        if (opp.RecordTypeId == exampleRecordTypeId) {
            opp.Type = 'New';
        }
    }
}

public static getRecordTypeId(String objectName, String recordTypeName) {
    return Schema.getGlobalDescribe().get(objectName).getDescribe().getRecordTypeInfosByName().get(recordTypeName).Id;
}
```

Although we have added another line of code and have reduced its readability slightly, we have optimized it significantly. Although I experienced this in a larger system I'm working in, I ran a smaller experiment to demonstrate the effects of this change.

## Experiment
Simulating the _unoptimized_ version of the code above, I executed the following in the Developer Console's Execute Anonymous.

```javascript
for (Integer i = 0; i < 1000; i++) {
    RecordTypeInfo rtInfo = Schema.getGlobalDescribe().get('Opportunity').getDescribe().getRecordTypeInfosByName().get('example record type');
}
```

I opened the log produced from this execution and still within the Developer Console, went to `Debug > Switch Perspective > Analysis (Predefined)`. Within the `Execution Overview` section, the tabe `Timeline` shows the CPU use.

![UnoptimizedSchema](/assets/img/unoptimized-schema.png)

It used **12,553.27 milliseconds**, or **12.5** seconds of CPU time! This is crazy since it's such a simple piece of code. I could not believe it, so I ran the optimized version.

```javascript
RecordTypeInfo rtInfo = Schema.getGlobalDescribe().get('Opportunity').getDescribe().getRecordTypeInfosByName().get('exanoke record type');
for (Integer i = 0; i < 1000; i++) {
    RecordTypeInfo innerInfo = rtInfo;
}
```

Looking at the same log analysis for the optimized code:

![OptimizedSchema](/assets/img/optimized-schema.png)

The optimized version used **264.97 milliseconds** of CPU time. What a difference! You can imagine – on a really rough estimate – that accessing the record type name from the `Schema` class costs ~10 milliseconds.

## Conclusion
If you have similar code in any of your existing systems, I recommend ensuring that it is optimized. Not caching the Schema metadata can hurt the speed and efficiency of your Salesforce Org. Otherwise, just keep this experiment in mind going forward. I know I will.