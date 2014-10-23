(function(window) {
  var I18n, assert, findTemplate, lookupKey,
    PlainHandlebars, EmHandlebars, keyExists;

  PlainHandlebars = window.Handlebars;
  EmHandlebars = Ember.Handlebars;
  assert = Ember.assert;

  lookupKey = function (key, hash) {
    var firstKey, idx, remainingKeys;

    if (hash[key] != null) {
      return hash[key];
    }

    if ((idx = key.indexOf('.')) !== -1) {
      firstKey = key.substr(0, idx);
      remainingKeys = key.substr(idx + 1);
      hash = hash[firstKey];
      if (hash) {
        return lookupKey(remainingKeys, hash);
      }
    }
  };

  findTemplate = function (key, setOnMissing) {
    assert("You must provide a translation key string, not %@".fmt(key), typeof key === 'string');
    var result = lookupKey(key, I18n.translations);

    if (setOnMissing) {
      if (result == null) {
        result = I18n.translations[key] = function () {
          return I18n.missingMessage(key);
        };
        result._isMissing = true;
        I18n.trigger('missing', key);
      }
    }

    if ((result != null) && !Ember.$.isFunction(result)) {
      result = I18n.translations[key] = I18n.compile(result);
    }

    return result;
  };

  keyExists = function (key) {
    var translation = lookupKey(key, I18n.translations);
    return translation != null && !translation._isMissing;
  };

  function eachTranslatedAttribute(object, fn) {
    var isTranslatedAttribute = /(.+)Translation$/,
      isTranslatedAttributeMatch;

    for (var key in object) {
      isTranslatedAttributeMatch = key.match(isTranslatedAttribute);
      if (isTranslatedAttributeMatch) {
        fn.call(object, isTranslatedAttributeMatch[1], I18n.t(object[key]));
      }
    }
  }

  function compileTemplate(template) {
    return function (data) {
      return template.replace(/\{\{(.*?)\}\}/g, function (i, match) {
        return data[match];
      });
    };
  }

  function getRenderedName(view) {
    var renderedName = view.get('renderedName');

    while (!renderedName && view) {
      view = view.get('_parentView');
      renderedName = view.get('renderedName');
    }

    return renderedName;
  }

  I18n = Ember.Evented.apply(Ember.Object.create({
    pluralForm: undefined,

    compile: compileTemplate,

    translations: {},

    // Ember.I18n.eachTranslatedAttribute(object, callback)
    //
    // Iterate over the keys in `object`; for each property that ends in "Translation",
    // call `callback` with the property name (minus the "Translation" suffix) and the
    // translation whose key is the property's value.
    eachTranslatedAttribute: eachTranslatedAttribute,

    template: function (key, count) {
      var interpolatedKey, result, suffix;
      if ((count != null) && (I18n.pluralForm != null)) {
        suffix = I18n.pluralForm(count);
        interpolatedKey = "%@.%@".fmt(key, suffix);
        result = findTemplate(interpolatedKey, false);
      }
      return result != null ? result : result = findTemplate(key, true);
    },

    t: function (key, context) {
      var template;
      if (context == null) context = {};
      template = I18n.template(key, Ember.get(context, 'count'));
      return template(context);
    },

    exists: keyExists,

    missingMessage: function (key) {
      return "Missing translation: " + key;
    },

    TranslateableProperties: Ember.Mixin.create({
      init: function () {
        var result = this._super.apply(this, arguments);

        eachTranslatedAttribute(this, function (attribute, translation) {
          var setTranslation = function () {
            if (!this.get(attribute + 'Translation')) {
              Ember.I18n.removeObserver('translations', this, setTranslation);
              return;
            }

            Ember.set(this, attribute, I18n.t(this.get(attribute + 'Translation')));
          };
          this.addObserver(attribute + 'Translation', this, setTranslation);
          Ember.I18n.addObserver('translations', this, setTranslation);
          Ember.set(this, attribute, translation);
        });

        return result;
      }
    }),

    TranslateableAttributes: Ember.Mixin.create({
      didInsertElement: function () {
        var result = this._super.apply(this, arguments);
        eachTranslatedAttribute(this, function (attribute, translation) {
          var setTranslation = function () {
            if (this.$() == null) {
              Ember.I18n.removeObserver('translations', this, setTranslation);
              return;
            }

            this.$().attr(attribute, I18n.t(this.get(attribute + 'Translation')));
          };

          Ember.I18n.addObserver('translations', this, setTranslation);
          this.$().attr(attribute, translation);
        });
        return result;
      }
    })
  }));

  Ember.I18n = I18n;

  // Generate a universally unique id
  var _uuid = 0;
  function uniqueElementId() {
    var i = ++_uuid;
    return 'i18n-' + i;
  }

  EmHandlebars.registerBoundHelper('t', function (key, options) {
    // Get current view in buffer, if any
    var view = options.data.view;
    var bindView = view.get("_childViews").find(function(v){
      return (v._state || v.state) === "inBuffer";
    });
    // If there is a current view in buffer, it should be the initial render of our `t` binding
    if(!!bindView){
      // Set up translations binding
      view.registerObserver(Ember.I18n, 'translations', bindView, bindView.rerender);
    }

    var translationKey = key.charAt(0) === '.' ? getRenderedName(view) + key : key;
    return new PlainHandlebars.SafeString(I18n.t(translationKey, options.hash));
  });

  var attrHelperFunction = function(options) {
    var attrs, result;
    attrs = options.hash;
    result = [];

    var dataId = uniqueElementId();

    Ember.keys(attrs).forEach(function(property) {
      return result.push('%@="%@"'.fmt(property, I18n.t(attrs[property])));
    });

    result.push('data-' + dataId + '="' + dataId + '"');

    var view = options.data.view;
    var observer = function(){
      var elem = view.$("[data-" + dataId + "='" + dataId + "']");
      Ember.keys(attrs).forEach(function(property) {
        return elem.attr(property, I18n.t(attrs[property]));
      });
    };

    view.registerObserver(Ember.I18n, 'translations', observer);
    return new EmHandlebars.SafeString(result.join(' '));
  };

  EmHandlebars.registerHelper('i18n-attr', attrHelperFunction);
  EmHandlebars.registerHelper('ta', attrHelperFunction);

}).call(undefined, this);
