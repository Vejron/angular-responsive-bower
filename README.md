# Angular Responsive
Library for changing content based on view port width. The library is for AngularJS `1.2.5+`.

## Building
Make sure you have [Node.js](http://nodejs.org), then install dependencies.

```shell
npm install -g grunt-cli
npm install
bower install
```

Then to build the library just run grunt.

```shell
grunt
```
### Testing
For testing [PhantomJS](http://phantomjs.org) is used, make sure you have it installed. If you wan't to use a different browser install a launcher for it. To install the runner for Firefox and save the dependency to the node development dependencies run npm as follows.
```shell
npm install karma-firefox-launcher --save-dev
```

### Example
You can launch an example page by running grunt example.

```shell
grunt example
```

and your default browser should open to `http://localhost:3000/index.html`.

There are two example pages, one uses the default values and one uses custom classes and widths.

## Rules

### Classes

There are a number of classes used for showing and hiding.

`visible-xs` : Only showing on 'xsmall'.

`visible-sm` : Only showing on 'small'.

`visible-md` : Only showing on 'medium'.

`visible-lg` : Only showing on 'large'.

`hidden-xs` : Showing on all except on 'xsmall'.

`hidden-sm` : Showing on all except on 'small'.

`hidden-md` : Showing on all except on 'medium'.

`hidden-lg` : Showing on all except on 'large'.

### Widths

The named widths are the following:

`xsmall` : Widths up to 767px.

`small` : Widths from 768px up to 991px.

`medium` : Widths from 992px up to 1199px.

`large` : Widths 1200px and larger.

### Bootstrap

The classes and widths used by the directive have been copied from [Bootstrap](http://getbootstrap.com/). It's however possible to customize both the classes and the widths used, see the [documentation below](#customizing)

## Customizing

### Widths
To customize the different widths at which the page should adapt, just set new options for the widthOptionsProvider

```javascript
angular.module('myModule', []).config(["widthOptionsProvider",function(provider) {
  var options = {widths:[{name:"small",minWidth:0,maxWidth:599},
      {name:"medium",minWidth:600,maxWidth:1099},
      {name:"large",minWidth:1100,maxWidth:Infinity}]
  };
  provider.setOptions(options);
}]);
```
the options should be an object with a `widths` property consisting of an array with objects. Those object must have the following properties `name`, `minWidth` and `maxWidth`. If you change the names from any of the defaults you must add options for the classes as well.

### Classes

These are used as rules for triggering based on the widths defined above.

```javascript
angular.module('myModule', []).config(["responderRuleFactoryProvider",function(provider){
    var classes = {classes:[
      {name:"show-small", rule: {visible:["small"]}},
      {name:"show-medium", rule: {visible:["medium"]}},
      {name:"show-large", rule: {visible:["large"]}},
      {name:"hide-small", rule: {visible:["medium","large"]}},
      {name:"hide-medium", rule: {visible:["small","large"]}},
      {name:"hide-large", rule: {visible:["small","medium"]}}
    ]
    };
    provider.setResponderClasses(classes);
}]);
```
the classes should be an object with a `classes` property containing an array with objects. Those objects must have a `name` and a `rule` property. The `rule` property should hold an object with a `visible` array containing strings that matches the names of the defined widths. The `name` property will be used as input to the directive.

## Usage
The directives in this library is meant to simplify usage in templates, if you don't mind writing code I recommend using the built in angular directives. There is an example achieving the same result with angular directives for each of the responsive-directives. This is done by utilizing `responders` in the library, the responders are [described below](#responders).

### If
Including element only if a rule is met.
#### responsiveIf
Add a dependency to the directive

```javascript
	angular.module('myModule', ['responsive.if']);
```

then just add the attribute `ee-responsive-if` with a string value consisting of one or more [classes](#classes) separated by a space

```html
    <div ee-responsive-if="'visible-sm visible-md'">angular-responsive</div>
```
#### ngIf
To do the same thing as with responsiveIf, but using ngIf instead.
	
Add a dependency to the `responsive.responder` module.
```javascript
angular.module('myModule', ['responsive.responder']);
```

In the controller create a boolean responder and register a trigger for the class/classes you want the element to show for.
```javascript
	angular.module('myModule', ['responsive.responder']).controller(['responderFactory',function(responderFactory){
		var responder = responderFactory.getBooleanResponder('visible-xs visible-sm');
		var triggerFunction = function(response){
			$scope.showElement = response;
		};
        responder.registerTrigger(triggerFunction);
		...
```

Then just set the ng-if attribute.

```html
	<div ng-if="showElement">angular-responsive</div>
```

### Include
Including a template. This can be useful if you have a lot of bindings and the results are hidden on smaller screens or that you want the layout to change completely and it's not possible to do with css.
	
#### ngInclude
Add a dependency to the `responsive.responder` module.
```javascript
angular.module('myModule', ['responsive.responder']);
```
Create a string responder and add one or more source strings.

```javascript
	angular.module('myModule', ['responsive.responder']).controller(['responderFactory',function(responderFactory){
		var responder = responderFactory.getStringResponder([{classes:'visible-xs',response:'xs.tpl.html'},{classes:'hidden-xs',response:'s.tpl.html'}]);
		var triggerFunction = function(response){
			$scope.source = response;
		};
        responder.registerTrigger(triggerFunction);
		...
```

Then just use ng-include as normal
```html
	<div ng-include="source"></div>
```


##Responders
Responders trigger a function with a value based on view port width and which classes has been registered. The trigger function will be called directly after registering. They are in the module `responsive.responder`.

###Responder
The responder will call the function with the name of the class.
```javascript
	var responder = responderFactory.getResponder();
	responder.registerTrigger(triggerFunction);
```


###BooleanResponder
The create method for boolean responders takes a string, this string should be one or more [classes](#classes).
The responder will call the function with true or false depending on the class or classes entered on create.

```javascript
	var responder = responderFactory.getBooleanResponder('visible-xs visible-sm');
	responder.registerTrigger(triggerFunction);
```

###StringResponder
The create method for the string responder expects an array with objects. Each object should have two properties `classes` and `response`. `classes` should contain a string with one or more [classes](#classes). The `response` should be a string, this string will be returned when the classes matches with the current width. If multiple objects classes matches the current width only the `response` of the first object in the array will be returned. If no object has a matching `classes` the trigger function will be called with `null`.

```javascript
	var responder = responderFactory.getStringResponder([{classes:'visible-xs',response:'xs.tpl.html'},{classes:'hidden-xs',response:'s.tpl.html'}]);
	responder.registerTrigger(triggerFunction);
```
	
## The Future

This is what is planned for the future.
### Building
Add posibility to build without directives.

### ResponsiveIf
Rewrite to not use code copied from ngIf.

### Responsive images
A directive for responsive images will be added.

### Responsive include
Create a directive to work as ngInclude in the same way as responsiveIf.

### Responsive classes
A directive to add classes based on widths will be added. This directive will never be something that should be used in production, but as a tool for the early parts of development.
