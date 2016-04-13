angular.module('responsive.if',['responsive.responder']).directive('eeResponsiveIf',['responderFactory','$animate',function(responderFactory,$animate){
    return {
        restrict: "A",
        priority:601,
        terminal:true,
        transclude:'element',
        $$tlb:true,
        link: function ($scope, $element, $attr, ctrl, $transclude) {
            var responder = null;
            $scope.$watch($attr.eeResponsiveIf, function (value) {
                deregister();
                if (value){
                    responder = responderFactory.getBooleanResponder(value);
                    responder.registerTrigger(responderFunction);
                }
            });
            var deregister = function(){
                if (responder != null){
                    responder.deregister();
                }
            };
            $scope.$on('$destroy',function(){
                deregister();
            });
            var responderFunction = function(value){
                ngIfWatchAction(value);
            };
            //This function is lifted from ng-if, would like a better way to use this code than copy/paste.
            var block, childScope;
            function ngIfWatchAction(value) {

                if (toBoolean(value)) {
                    if (!childScope) {
                        childScope = $scope.$new();
                        $transclude(childScope, function (clone) {
                            clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
                            // Note: We only need the first/last node of the cloned nodes.
                            // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                            // by a directive with templateUrl when it's template arrives.
                            block = {
                                clone: clone
                            };
                            $animate.enter(clone, $element.parent(), $element);
                        });
                    }
                } else {

                    if (childScope) {
                        childScope.$destroy();
                        childScope = null;
                    }

                    if (block) {
                        $animate.leave(getBlockElements(block.clone));
                        block = null;
                    }
                }
            }
            function toBoolean(value) {
                if (value && value.length !== 0) {
                    var v = angular.lowercase("" + value);
                    value = !(v == 'f' || v == '0' || v == 'false' || v == 'no' || v == 'n' || v == '[]');
                } else {
                    value = false;
                }
                return value;
            }
            function getBlockElements(nodes) {
                var startNode = nodes[0],
                    endNode = nodes[nodes.length - 1];
                if (startNode === endNode) {
                    return jqLite(startNode);
                }

                var element = startNode;
                var elements = [element];

                do {
                    element = element.nextSibling;
                    if (!element) {break;}
                    elements.push(element);
                } while (element !== endNode);

                return angular.element(elements);
            }
            //

        }

    };

}]);;angular.module('responsive.src', ['responsive.responder.rule']).directive('eeSrc',['srcPostLink',function(postLink){
    return {
        restrict: "E",
        require:'?^ee-responsive-image',
        link:postLink
    };


}]).factory('srcPostLink',[function(){
        var postLink = function(scope,iElement,iAttrs,controller){
            if (!controller){
                throw 'No controller, ee-src must be have a parent directive, \'ee-responsive-include\'';
            }
            if (!iAttrs.responsiveSrc){
                throw 'Must have a responsive-src attribute';
            }
            var src = null;
            var classes = null;
            scope.$watch(iAttrs.responsiveSrc, function (value,oldValue) {
                if(value !== oldValue){
                    src = value;
                    controller.removeSrc(oldValue);
                    controller.addClassesForSrc(src, classes);
                }

            });
            src = scope.$eval(iAttrs.responsiveSrc);
            if (iAttrs.responsiveClasses){
                classes = scope.$eval(iAttrs.responsiveClasses);
                scope.$watch(iAttrs.responsiveClasses, function (value,oldValue) {
                    if(value !== oldValue){
                        classes = value;
                        controller.addClassesForSrc(src, classes);
                    }

                });
            }
            controller.addClassesForSrc(src, classes);
        };
        return postLink;
}]);
;angular.module( 'responsive.listener', ['responsive.width'])
    .service('widthEventListener', ['$window','widthFactory','$rootScope',function ($window,widthFactory,$rootScope){
    var lastWidth = widthFactory.getWidth($window.innerWidth);
    //todo only listen to events when one or more listeners are active.
    var listen = function(){
        var w = angular.element($window);
        w.on('resize', handler);
    };
    var subscribed = [];
    var isSubscribed = function(func){
        return subscribed.indexOf(func) !== -1;
    };
    var hasSubscribers = function(){
        return subscribed.length > 0;
    };
    this.subscribe = function(func){
        if (!isSubscribed(func)){
            subscribed.push(func);
            func(lastWidth);
        }
    };
    this.unSubscribe = function(func){
        if(isSubscribed(func)){
            var index = subscribed.indexOf(func);
            subscribed.splice(index,1);
        }
    };
    var handler = function(event){
        var width = $window.innerWidth;
        handleResize(width);

    };
    var handleResize = function(newWidth){
        var width = widthFactory.getWidth(newWidth);
        if (width !== lastWidth){
            lastWidth = width;
            callSubscribed(lastWidth);
            if (hasSubscribers()){
                $rootScope.$digest();
            }
        }

    };
    var callSubscribed = function(value){
        for (var i = 0; i < subscribed.length; i++) {
            var subscriber = subscribed[i];
            subscriber(value);
        }
    };
    listen();
}]);;angular.module( 'responsive.responder', ['responsive.listener','responsive.responder.rule'])
.factory('responderFactory',['widthEventListener','responderRuleFactory',function(eventListener,responderRuleFactory){
        var ResponderFactory = function(){};
        var Responder = function(){
            this.listener = null;
        };

        Responder.prototype.createListener = function(func){};
        Responder.prototype.registerTrigger = function(func){
            this.createListener(func);
            eventListener.subscribe(this.listener);
        };
        Responder.prototype.deregister = function(){
            eventListener.unSubscribe(this.listener);
        };
        Responder.prototype.createListener = function(func){
            this.listener = function(width){
                var response = width.name;
                func(width.name);
            };
        };
        ResponderFactory.prototype.getResponder = function(){
            return new Responder();
        };
        var BooleanResponder = function(rule){
            this.rule = rule;
        };
        BooleanResponder.prototype = new Responder();
        BooleanResponder.prototype.createListener = function(func){
            var rule = this.rule;
            this.listener = function(width){
                var response = rule.widthValue(width.name);
                func(response);
            };
        };
        ResponderFactory.prototype.getBooleanResponder = function(classes){
            var rule = responderRuleFactory.getRule(classes);

            return new BooleanResponder(rule);
        };
        var StringResponder = function(ruleSets){
            this.ruleSets = ruleSets;
        };
        StringResponder.prototype = new Responder();
        StringResponder.prototype.createListener = function(func){
            var ruleSets = this.ruleSets;
            this.listener = function(width){
                for (var i = 0; i < ruleSets.length; i++) {
                    var ruleSet = ruleSets[i];
                    if(ruleSet.rule.widthValue(width.name)){
                        func(ruleSet.response);
                        return;
                    }
                }
                func(null);
            };
        };
        ResponderFactory.prototype.getStringResponder = function(ruleList){
            var ruleSets = [];
            for (var i = 0; i < ruleList.length; i++) {
                var ruleItem = ruleList[i];
                var rule = responderRuleFactory.getRule(ruleItem.classes);
                ruleSets.push({rule:rule,response:ruleItem.response});
            }

            return new StringResponder(ruleSets);
        };
        return new ResponderFactory();
}]);;angular.module( 'responsive.responder.rule', ['responsive.width'])
.constant('defaultResponderClasses',{classes:[
        {name:"visible-xs", rule: {visible:["xsmall"]}},
        {name:"visible-sm", rule: {visible:["small"]}},
        {name:"visible-md", rule: {visible:["medium"]}},
        {name:"visible-lg", rule: {visible:["large"]}},
        {name:"hidden-xs", rule: {visible:["small","medium","large"]}},
        {name:"hidden-sm", rule: {visible:["xsmall","medium","large"]}},
        {name:"hidden-md", rule: {visible:["xsmall","small","large"]}},
        {name:"hidden-lg", rule: {visible:["xsmall","small","medium"]}}
    ]})
.provider('responderRuleFactory',['defaultResponderClasses',function(defaultClasses){
    var responderClasses = null;
    return {
        setResponderClasses: function(val) {
            responderClasses = val;
        },
        $get: ['widthOptions',function(widthOptions) {
            if (responderClasses === null){
                responderClasses = defaultClasses;
            }

            var getActiveClassDescriptors = function(classes){
                classes = classes.split(" ");
                var active = [];
                if(classes.length == 1 && classes[0] === ""){
                    return active;
                }
                for (var i = 0; i < classes.length; i++) {
                    var item = getClassRules(classes[i]);
                    if (item === null){
                        throw "Class not supported.";
                    }
                    active.push(item);
                }
                return active;
            };
            var getClassRules = function(cssClass){
                var classes = responderClasses.classes;
                for (var i = 0; i < classes.length; i++) {
                    var responderClass = classes[i];
                    if (responderClass.name === cssClass){
                        return responderClass.rule;
                    }
                }
                return null;
            };
            var createDefaultWidthRules = function(){
                var widthRules = {};
                var availableWidths = widthOptions.widths;
                for (var i = 0; i < availableWidths.length; i++) {
                    var width = availableWidths[i];
                    var name = width.name;
                    if (name === undefined){
                        throw "WidthOption lacks name";
                    }
                    widthRules[name] = {visible:false};
                }
                return widthRules;
            };
            var createWidthRules = function(active){
                var widthRules = createDefaultWidthRules();
                for (var i = 0; i < active.length; i++) {
                    var activeRule = active[i];
                    for (var j = 0; j < activeRule.visible.length; j++) {
                        var visible = activeRule.visible[j];
                        widthRules[visible].visible = true;
                    }
                }
                return widthRules;
            };
            var createRule = function(active){
                return new Rule(createWidthRules(active));
            };
            var Rule = function(widthRules){
                this.rules = widthRules;
            };
            Rule.prototype.widthValue = function(widthName){
                return this.rules[widthName].visible;
            };
            var RuleFactory = function(){};
            RuleFactory.prototype.getRule = function(classes){
                var active = getActiveClassDescriptors(classes);
                return createRule(active);
            };


            return new RuleFactory();
        }]

    };

}]);;angular.module( 'responsive.width', []).
constant('defaultOptions',{widths:[{name:'xsmall',minWidth:0,maxWidth:767},
             {name:'small',minWidth:768,maxWidth:991},
             {name:'medium',minWidth:992,maxWidth:1199},
             {name:'large',minWidth:1200, maxWidth:Infinity}]})
.factory('widthFactory',['widthOptions',function(options){
    var WidthFactory = function(){};
    WidthFactory.prototype.getWidth = function(width){
        for (var i = 0; i < options.widths.length; i++) {
            var widthDescriptor = options.widths[i];
            if (width >= widthDescriptor.minWidth &&
                width <= widthDescriptor.maxWidth){
                return widthDescriptor;
            }
        }
        throw "Unsupported width";
    };
    return new WidthFactory();

}]).provider('widthOptions',['defaultOptions',function(defaultOptions){
        var opts = null;
        return {
            setOptions: function(val) {

                opts = val;
            },
            $get: function() {
                if (opts){
                    return opts;
                }
                return defaultOptions;
            }

        };

    }]);