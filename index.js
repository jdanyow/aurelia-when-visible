define(['exports', 'aurelia-templating-resources'], function (exports, templatingResources) {
  'use strict';

  var IntersectionObserver = window.IntersectionObserver;

  if (typeof IntersectionObserver !== 'function') {
    exports.WhenVisibleBindingBehavior = function () {
      this.bind = this.unbind = function() {};
    };
    return;
  }

  var Repeat = templatingResources.Repeat;

  function handleIntersectionEvents(entries, observer) {
    var i = entries.length;
    while (i--) {
      var entry = entries[i];
      var inView = entry.intersectionRatio > 0;
      var element = entry.target;
      element.__inView = inView;

      // <debugging-colors>
      /*var color = inView ? 'blue' : 'red';
      if (element.style.color !== color) {
        element.style.color = color;
      }*/
      // </debugging-colors>

      if (inView) {
        var j = element.bindings.length;
        while (j--) {
          var binding = element.bindings[j];
          binding.standardUpdateTarget(binding.__lastTargetValue);
        }
      }
    }
  }

  function observe(root, binding, unobserve) {
    var observer = (root || window).__intersectionObserver;
    if (observer === undefined) {
      observer = (root || window).__intersectionObserver = new IntersectionObserver(handleIntersectionEvents, { root });
    }

    var element = binding.target;
    if (element instanceof Repeat) {
      element = element.viewSlot.anchor.parentElement;
    } else if (element.nodeType === 3) {
      element = element.parentElement;
    }

    if (unobserve) {
      element.bindings.splice(element.bindings.indexOf(binding), 1);
      if (element.bindings.length === 0) {
        observer.unobserve(element);
      }
      return;
    }

    if (element.bindings === undefined) {
      element.bindings = [];
    }
    if (element.bindings.length === 0) {
      observer.observe(element);
    }
    element.bindings.push(binding);
  }

  function WhenVisibleBindingBehavior() {
  }

  WhenVisibleBindingBehavior.prototype.bind = function (binding, source, intersectionRoot) {
    var element = binding.target;
    if (element instanceof Repeat) {
      element = element.viewSlot.anchor.parentElement;
    } else if (element.nodeType === 3) {
      element = element.parentElement;
    }
    element.__inView = !!element.__inView;
    binding.__initialized = false;
    binding.standardUpdateTarget = binding.updateTarget;
    binding.updateTarget = function (value) {
      this.__lastTargetValue = value;
      var element = binding.target;
      if (element instanceof Repeat) {
        element = element.viewSlot.anchor.parentElement;
      } else if (element.nodeType === 3) {
        element = element.parentElement;
      }
      if (element.__inView || !this.__initialized) {
        this.__initialized = true;
        this.standardUpdateTarget(value);
      }
    };

    observe(intersectionRoot, binding, false);
  };

  WhenVisibleBindingBehavior.prototype.unbind = function (binding, source) {
    observe(intersectionRoot, binding, true);

    binding.updateTarget = binding.standardUpdateTarget;
    binding.standardUpdateTarget = null;
    binding.__lastTargetValue = null;
    binding.__initialized = false;
  };

  exports.WhenVisibleBindingBehavior = WhenVisibleBindingBehavior;
});
