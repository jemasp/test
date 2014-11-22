// test
var CI = (CI) ? CI : {};
CI.StyleableSelective = (CI.StyleableSelective) ? CI.StyleableSelective : {};

// inis n selectboxes
CI.StyleableSelective.Lists = function (selectBoxes, options) {
    "use strict";
    var substitutes = [];
    selectBoxes.each(function (selectBox) {
        substitutes = CI.StyleableSelective.instances.include(new CI.StyleableSelective.List(selectBox, options));
    });
};
// inis n linked selectboxes
CI.StyleableSelective.LinkedLists = new Class({
    "use strict";
Implements: Events,

    initialize
:
function (selectBoxes, options) {
    this.options = options;
    this.selectBoxes = selectBoxes;

    if (this.options.onSelected) {
        this.selectedEventFunction = this.options.onSelected;
        this.options.onSelected = 'undefined';
        this.addEvent('selected', this.selectedEventFunction);
    }

    this.substitutes = this.getSubstitutes();

    return this;
}
,
getSubstitutes: function () {
    var substitutes = [];
    this.selectBoxes.each(function (selectBox) {
        var substitute = new CI.StyleableSelective.List(selectBox, this.options);

        substitute.addEvent('selected', this.updateLinkedLists.bind(this));

        substitutes.push(substitute);
    }.bind(this));

    return substitutes;
}
,
updateLinkedLists: function () {
    var newSelectedIndex = arguments[0].selectedIndex;
    this.substitutes.each(function (list) {
        list.sync(newSelectedIndex);
    });
    this.fireEvent('selected');
}
})
;

/* Description: Substitutes selectlists with styleable js powered markup
 *
 */
CI.StyleableSelective.List = new Class({
    "use strict";
Implements: [Options, Events],

    options
:
{
    /*
     onInited: $empty,
     onOpened: $empty,
     onCLosed: $empty,
     onSelected: $empty,
     */
    substituteMarkup: 'div.substituteMarkup',
        selectedOption
:
    'span.selectedOption',
        toggleBtn
:
    'button.toggleBtn',
        optionsList
:
    'ul.optionsList',
        option
:
    'li',
        selectedOptionClass
:
    'selected',

        variableWidth
:
    true,
        fixedWidthAdjustment
:
    24
}
,
initialize: function (selectBox, options) {
    this.setOptions(options);

    this.selectBox = selectBox.store('object', this);
    this.selectedIndex = this.selectBox.selectedIndex;
    this.value = this.getValue();

    // selectBox substitute
    this.substitute = {};
    this.substitute.box = this.makeSubstitute().store('object', this);
    this.substitute.button = this.substitute.box.getElement('button');
    this.substitute.list = this.substitute.box.getElement(this.options.optionsList);
    this.substitute.options = this.substitute.list.getElements('li');

    this.charMap = this.getcharMap();

    // insert substitute markup into DOM
    this.selectBox.grab(this.substitute.box, 'after');

    // playing with widths
    if (this.options.variableWidth) {
        this.addEvents({
            'opened': this.equalizeSubstituteWidth.bind(this),
            // equalize width of subtitute box and option list if list is opened
            'closed': this.resetSubstituteWidth.bind(this) // reset width if list is closed
        });
    } else {
        this.setWidth();
    }
    // attach events
    this.attach();

    this.fireEvent('onInited', this);
}
,
attach: function () {
    this.bound = {
        hideList: this.hideList.bind(this),
        showList: this.showList.bind(this),
        selectOnKeys: this.selectOnKeys.bind(this),
        navigateOptionList: this.navigateOptionList.bind(this)
    };

    // DOM-Events
    this.substitute.box.addEvents({
        'click:once': this.toggleVisibilityOfOptionsList.bind(this),
        // open optionlist on click once
        'click:relay(li)': this.select.bind(this) // select hovered option on click
    });
    this.substitute.list.addEvents({
        'mouseenter': this.removeSelectedClass.bind(this),
        // the selected Option is visually marked. If the mouse hovers the optionlist remove mark.
        'mouseleave': this.addSelectedClass.bind(this) // if the mouse leaves the option list remark the selected option.
    });
    this.substitute.button.addEvents({
        'focus': function () {
            this.substitute.box.addClass('focus');
            this.substitute.box.addEvent('keydown', this.bound.navigateOptionList);
        }.bind(this),
        'blur': function () {
            this.substitute.box.removeClass('focus');
            this.substitute.box.removeEvent('keydown', this.bound.navigateOptionList);
            this.hideList();
        }.bind(this)

    });

    // Class Events
    this.addEvents({
        'opened:pause(10)': function () {
            document.getElement('body').addEvent('click:once', this.bound.hideList); // global hide optionlist on click once
            this.substitute.box.addEvent('keydown', this.bound.selectOnKeys);
            console.log('opened');
        },
        'closed:pause(10)': function () {
            this.substitute.box.addEvent('click:once', this.bound.showList); // open optionlist on click once
            this.substitute.box.removeEvent('keydown', this.bound.selectOnKeys);
            console.log('closed');
        }
    });

}
,
navigateOptionList: function (event) {
    var key = event.key,
        newSelectedIndex = this.selectedIndex;

    if (key == 'down' || key == 'up') {
        event.preventDefault();
        if (!this.substitute.list.isVisible()) {
            this.showList();
        }
    }
    if (key == 'down') {
        if (this.selectedIndex + 1 > this.substitute.options.length - 1) {
            newSelectedIndex = 0;
        } else {
            newSelectedIndex = this.selectedIndex + 1;
        }
    }
    if (key == 'up') {
        if (this.selectedIndex - 1 < 0) {
            newSelectedIndex = this.substitute.options.length - 1;
        } else {
            newSelectedIndex = this.selectedIndex - 1;
        }
    }
    this.update(newSelectedIndex);

    console.log(event.key);
}
,
getcharMap: function () {
    var charMap = {};

    this.substitute.options.each(function (option) {
        var value = option.get('text');
        this.addCharToMap(charMap, value, option);
    }.bind(this));

    return charMap;
}
,
addCharToMap: function (point, value, option) {
    var charAt = value.charAt(0).toLowerCase(),
        newPoint,
        newValue;

    if (value.length !== 0) {
        if (point[charAt]) {
            point[charAt].options.push(option);
            newPoint = point[charAt];
        } else {
            newPoint = point[charAt] = {options: [option]};
        }
        newValue = value.slice(1);
        this.addCharToMap(newPoint, newValue, option);
    } else {
        return;
    }
}
,
selectOnKeys: function (event) {
    var key = event.key,
        newSelectedIndex;

    if (!this.index) {
        this.index = 0;
    }

    if (this.reset) {
        clearTimeout(this.reset);
    }
    this.reset = this.resetPoint.delay(1000, this);

    if (key == 'enter') {
        this.fireEvent('selected', this);
    }
    if (!key.test(/[^A-Za-z0-9]/)) {
        return;
    }

    if (!this.point) {
        this.point = this.charMap;
    }

    if (this.point[key]) {
        this.prevPoint = this.point;
        this.point = this.point[key];
        newSelectedIndex = this.point.options[0].retrieve('index');
        console.log(newSelectedIndex);
        this.update(newSelectedIndex);
        console.log(key);
    } else {
        if (this.prevPoint[key]) {
            this.point = this.prevPoint[key];
            console.log(this.point);
            if (this.point.options.length - 1 >= this.index + 1) {
                console.log(this.point.options.length, this.index);
                this.index++;
            } else {
                this.index = 0;
            }
            newSelectedIndex = this.point.options[this.index].retrieve('index');
            this.update(newSelectedIndex);
            console.log(key);
        }
    }

}
,
resetPoint: function () {
    this.point = this.charMap;
    console.log('timeout', this.point);
}
,
// select the clicked option, update data and syncronize original selectbox
select: function (event) {
    var clickedOption = (typeof event == 'object') ? event.target.retrieve('index') : event,
        newSelectedIndex = clickedOption;

    this.update(newSelectedIndex);
    this.fireEvent('selected', this);
}
,
sync: function (newSelectedIndex) {
    if (this.selectedIndex != newSelectedIndex) {
        this.update(newSelectedIndex);
    }
}
,
update: function (newSelectedIndex) {
    this.oldSelectedIndex = this.selectedIndex;
    this.selectedIndex = newSelectedIndex;

    this.syncSelectBox(); // syncronize original selectbox
    this.syncSubstitute(); // syncronize Substitute
    this.equalizeSubstituteWidth();
}
,
// syncronize original selectbox
syncSelectBox: function () {
    this.selectBox.selectedIndex = this.selectedIndex;
    this.value = this.getValue();
}
,
// set new selected option in option list
syncSubstitute: function () {
    this.substitute.options[this.oldSelectedIndex].removeClass(this.options.selectedOptionClass);
    this.substitute.options[this.selectedIndex].addClass(this.options.selectedOptionClass);
    this.substitute.box.getElement(this.options.selectedOption).set('text', this.value);
}
,
getValue: function () {
    return this.selectBox.value || this.selectBox.getElements('option')[this.selectedIndex].get('text');
}
,
// set fixed Width for substitute box
setWidth: function () {
    var substituteWidth = this.substitute.box.clientWidth,
        substituteListWidth = this.getSubstituteListClientWidth();

    if (substituteWidth < substituteListWidth) {
        var adjust = substituteListWidth + this.options.fixedWidthAdjustment;
        this.substitute.box.setStyle('width', adjust);
        if (substituteListWidth < adjust) {
            this.substitute.list.setStyle('width', adjust);
        }
    }
}
,
getSubstituteListClientWidth: function () {
    var substituteListClientWidth;

    this.substitute.list.show();
    substituteListClientWidth = this.substitute.list.clientWidth;
    this.substitute.list.hide();

    return substituteListClientWidth;
}
,

// equalize width of subtitute box and option list if list is opened
equalizeSubstituteWidth: function () {
    if (this.substitute.box.clientWidth < this.substitute.list.clientWidth) {
        this.originalSubstituteWidth = this.substitute.box.clientWidth;
        this.substitute.box.setStyle('width', this.substitute.list.clientWidth);
    } else {
        this.originalListWidth = this.substitute.list.clientWidth;
        this.substitute.list.setStyle('width', this.substitute.box.clientWidth);
    }
}
,
// reset substitute width if option list is closed
resetSubstituteWidth: function () {
    if (this.originalSubstituteWidth) {
        this.substitute.box.setStyle('width', 'auto');
    }
    if (this.originalListWidth) {
        this.substitute.list.setStyle('width', 'auto');
    }
}
,
// removes the selected option marker from an option in the option list
removeSelectedClass: function () {
    this.substitute.options[this.selectedIndex].removeClass(this.options.selectedOptionClass);
}
,
// adds the selected option marker to an option in the option list
addSelectedClass: function () {
    this.substitute.options[this.selectedIndex].addClass(this.options.selectedOptionClass);
}
,
// if option list is visible hide it else show it
toggleVisibilityOfOptionsList: function () {
    if (this.substitute.list.isVisible()) {
        this.hideList();
    } else {
        this.showList();
    }
}
,
showList: function () {
    this.substitute.list.show();
    this.fireEvent('opened');
}
,
hideList: function () {
    this.substitute.list.hide();
    this.fireEvent('closed');
}
,
// inquire and return the subtitutes selected option
getSelectedLi: function () {
    var selectedLi;
    this.substitute.box.getElements('li').each(function (li) {
        if (li.hasClass(this.options.selectedOptionClass)) {
            selectedLi = li;
        }
    }.bind(this));
    return selectedLi;
}
,
// inquire and return the selected option by using the selected index of the select box
getSelectedOption: function (selectBox) {
    var index = selectBox.selectedIndex;
    return selectBox.getElements('option')[index];
}
,
// create and return substitute markup
makeSubstitute: function () {
    var substituteMarkup = new Element(this.options.substituteMarkup),
        selectedOption = new Element(this.options.selectedOption, {
            text: this.value
        }),
        toggleBtn = new Element(this.options.toggleBtn, {
            html: '<span>&bull;</span>',
            type: 'button'
        }),
        optionsList = new Element(this.options.optionsList);

    this.getOptionsMarkup(optionsList);

    return substituteMarkup.adopt(selectedOption, toggleBtn, optionsList);
}
,
// create list elements for the option list of the substitute
getOptionsMarkup: function (optionsList) {
    this.selectBox.getElements('option').each(function (option, index) {
        var optionMarkup = new Element(this.options.option, {
            text: option.get('text') || option.get('value')
        });
        if (this.selectedIndex == index) {
            optionMarkup.addClass(this.options.selectedOptionClass);
        }
        optionMarkup.store('index', index);
        optionsList.grab(optionMarkup);
    }.bind(this));
}
})
;

window.addEvent('domready', function () {
    "use strict";
    CI.StyleableSelective.instances = [];

    CI.StyleableSelective.instances.push(new CI.StyleableSelective.List(document.getElement('#oneList'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        }
    }));
    CI.StyleableSelective.instances.push(new CI.StyleableSelective.List(document.getElement('#ajax'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        },
        onSelected: function () {
            this.selectBox.getParent('form').send();
        }
    }));
    CI.StyleableSelective.instances.push(CI.StyleableSelective.Lists(document.getElements('select.substitute'), {
        variableWidth: false,
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        }
    }));
    CI.StyleableSelective.instances.push(new CI.StyleableSelective.LinkedLists(document.getElements('select.linkedSubstitute'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        }
    }));

    CI.StyleableSelective.instances.push(new CI.StyleableSelective.LinkedLists(document.getElements('select.linkedSubstituteAjax'), {
        onOpened: function () {
            this.substitute.box.addClass('focus');
        },
        onClosed: function () {
            this.substitute.box.removeClass('focus');
        },
        onSelected: function () {
            this.selectBoxes.pick().getParent('form').send();
        }
    }));

    CI.StyleableSelective.instances.flatten();
});