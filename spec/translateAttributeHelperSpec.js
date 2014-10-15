describe('{{i18n-attr}}', function() {
  it('outputs translated attribute strings', function() {
    var view = this.renderTemplate('<a {{i18n-attr title="foo.bar" data-disable-with="foo.save.disabled"}}></a>');
    Ember.run(function() {
      expect(view.$('a').attr('title')).to.equal('A Foobar');
      expect(view.$('a').attr('data-disable-with')).to.equal('Saving Foo...');
    });
  });
});

describe('{{ta}}', function() {
  it('outputs translated attribute strings', function() {
    var view = this.renderTemplate('<a {{ta title="foo.bar" data-disable-with="foo.save.disabled"}}></a>');
    Ember.run(function() {
      expect(view.$('a').attr('title')).to.equal('A Foobar');
      expect(view.$('a').attr('data-disable-with')).to.equal('Saving Foo...');
    });
  });
});

describe('{{ta}} == {{i18n-attr}}', function() {
  it('check that {{ta}} and {{i18n-attr}} outputs the same', function() {
    var view = this.renderTemplate('<a {{ta title="foo.bar" data-disable-with="foo.save.disabled"}}></a><span {{i18n-attr title="foo.bar" data-disable-with="foo.save.disabled"}}></span>');
    Ember.run(function() {
      expect(view.$('a').attr('title')).to.equal(view.$('span').attr('title'));
      expect(view.$('a').attr('data-disable-with')).to.equal(view.$('span').attr('data-disable-with'));
    });
  });
});

// TODO Add tests for translations change