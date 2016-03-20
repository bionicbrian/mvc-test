(function () {

function assign(target) {
    var sources = Array.prototype.slice.call(arguments, 1);
    sources.forEach(function (source) {
        if (typeof source === "object") {
            Object.keys(source).reduce(function (o, k) {
                o[k] = source[k];
                return o;
            }, target);
        }
    });
}

// var Klass = {
//     prototype: {
//         // Simply copy spec props to instance
//         init: function (spec) {
//             assign(this, spec);
//         }
//     },

//     include: function (spec) {
//         assign(this.prototype, spec);
//         return this;
//     },

//     extend: function (spec) {
//         assign(this, spec);
//         return this;
//     },

//     createClass: function(spec) {
//         var klass = Object.create(this);
//         klass.prototype = Object.create(this.prototype);
//         klass.parent = this;

//         if (klass.onCreated) klass.onCreated();
//         if (this.onSubclass) this.onSubclass(klass);

//         if (spec) klass.include(spec);

//         return klass;
//     },

//     init: function (spec) {
//         // Create instance from the prototype!
//         var inst = Object.create(this.prototype);
//         inst.parent = this;

//         inst.init(spec);

//         return inst;
//     }
// };

var Events = {
    publish: function (eventName, payload) {
        var handlers = this._eventHandlers[eventName];
        if (!handlers || !handlers.forEach) {
            return;
        }
        handlers.forEach(function (handler) {
            handler(payload);
        });
    },
    subscribe: function (eventName, handler) {
        if (!this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = [];
        }
        var handlers = this._eventHandlers[eventName];
        handlers.push(handler);

        var idx = handlers.length - 1;
        return function () {
            handlers.splice(idx, 1);
        };
    },
    initEvents: function () {
        this._eventHandlers = {};
    }
};

// MODEL STUFF =========================

var Model = {
    prototype: {
        init: function (spec) {
            assign(this, spec);
            this.initEvents();
        },
        set: function (key, val) {
            this[key] = val;
            this.publish("change", this);
        }
    },
    createClass: function (spec) {
        var o = Object.create(this);
        o.prototype = Object.create(this.prototype);

        assign(o.prototype, spec, Events);

        return o;
    },
    init: function (spec) {
        var o = Object.create(this.prototype);

        o.init(spec);

        return o;
    }
};

var Dog = Model.createClass({
    sayHello: function () {
        return "Bark bark, I'm " + this.name + "!";
    },
    wholeName: function () {
        return this.name + " the dog";
    }
});

var SmallDog = Dog.createClass({
    sayHello: function () {
        return "Yip! Yip! I'm " + this.wholeName() + "! Me small dog.";
    }
});

var Chihuahua = SmallDog.createClass({
    sayHello: function () {
        return "Hola! Yo soy un perro. Me llamo " + this.wholeName() + ".";
    },
    wholeName: function () {
        return this.name + " el perrito";
    }
});

var fido = Dog.init({ name: "Fido" });
console.log(fido.sayHello());

var ruff = Dog.init({ name: "Ruff" });
console.log(ruff.sayHello());

var fifi = SmallDog.init({ name: "Fifi" });
console.log(fifi.sayHello());

var pablo = Chihuahua.init({ name: "Pablo" });
console.log(pablo.sayHello());

pablo.subscribe("change", function (model) {
    console.log(model.name + " has changed.");
});

pablo.set("name", "Juanito");
fifi.set("name", "FooFoo");

// VIEW STUFF =================================

function frag() {
    return document.createDocumentFragment();
}
function createElement(type) {
    return document.createElement(type);
}
function text(text) {
    return document.createTextNode(text);
}
function append(parent, child) {
    parent.appendChild(child);
    var newChild = parent.children[parent.children.length - 1];
    return newChild;
}
function element(type, attrs) {
    var el = createElement(type);
    Object.keys(attrs).reduce(function (el, a) {
        el.setAttribute(a, attrs[a]);
        return el;
    }, el);

    var children = Array.prototype.slice.call(arguments, 2);
    if (children) {
        children.forEach(function (child) {
            append(el, child);
        });
    }

    return el;
}
var div = element.bind(null, "div");
var span = element.bind(null, "span");
var input = element.bind(null, "input");
var form = element.bind(null, "form");

function appendToFrag(el) {
    var f = frag();
    append(f, el);
    return f;
}

var Presenter = {
    init: function () {
        this.model = Dog.init({ name: "Fido" });
        return this;
    },
    template: function () {
        var t = div({ "class": "hello" },
                    span({}, text(this.model.name)),
                    form({ "class": "my-form" },
                         input({ "class": "name", "placeholder": "New name?" }))
                 );
        return appendToFrag(t);
    },
    _appendElementToDOM: function () {
        this.element = append(document.querySelector("main"), this.template())
    },
    show: function () {
        if (!this.element) {
            this._appendElementToDOM();
        } else {
            this.element.parentNode.removeChild(this.element);
            this._appendElementToDOM();
        }
        this._removeListeners();
        this._listen();
    },
    _removeListeners: function () {
        if (this._unsubs) {
            this._unsubs.forEach(function (unsub) {
                unsub();
            });
        }
    },
    _addDOMListener: function (element, event, handler) {
        element.addEventListener(event, handler);
        return function () {
            element.removeEventListener(event, handler);
        };
    },
    changeName: function (ev) {
        ev.preventDefault();
        var name = ev.target.querySelector(".name").value;
        this.model.set("name", name);
    },
    _listen: function () {
        this._unsubs = [
            this.model.subscribe("change", this.show.bind(this)),
            this._addDOMListener(this.element.querySelector(".my-form"),
                                 "submit",
                                 this.changeName.bind(this))
        ];
    }
};

// Presenter.init().show();



}());
