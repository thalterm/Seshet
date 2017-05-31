var formulafield = Object();
var currentfocus = null;
updateCurrentFocus = function(event) {
    currentfocus = event.target;
}

function onLoad(){
    m = new MathInputLine($('#mathinput-container'));
}

function MathTextBox(parent, required, content){
    this.required = required;
    this.parent = parent;
    this.root = parent.root;
    this.element = $(this.htmlprototype);
    this.element.bind('input',scaleinputlistener);
    if (content !== undefined) this.element[0].value=content;
}

MathTextBox.prototype.htmlprototype = '<input class="math-text-box" size=1 type="text"></input>';

MathTextBox.prototype.toString = function(){
    return this.element[0].value;
}

MathTermField = function (parent){
    this.parent = parent;
    if (parent) this.root = parent.root;
    this.element = $(this.htmlprototype);
    this.list = [new MathTextBox(this)];
    this.element.append(this.list[0].element);
}

MathTermField.prototype.htmlprototype = '<span class="mathtermfield"></span>'

function MathInputLine(container){
    this.root = this;
    this.body = new MathTermField(this);
    this.element = $(this.htmlprototype);
    this.element.append(this.body.element);
    container.append(this.element);
}

MathInputLine.prototype.htmlprototype = '<span class="math-input-line"></span>'

function MathSymbol (parent){
    this.parent = parent;
    if(parent != undefined) this.root = parent.root;
}

function Fraction (parent){
    
}

function scaleinput(target){
    var len = target.value.length;
    if (len > 0) {
        target.style.background = 'none';
        target.size = len;
    } else {
        target.style.background = 'lightgrey';
        target.size = 1;
    }
}
var scaleinputlistener= function(event){
    scaleinput(event.target);
}