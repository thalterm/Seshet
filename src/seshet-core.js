var formulafield = Object();
var seshetFocus = null;
updateCurrentFocus = function(event) {
    seshetFocus = event.target.container;
}

function SeshetTextBox(parent, required, content){
    this.required = required;
    this.prevOperator = null;
    this.parent = parent;
    this.root = parent.root;
    this.element = $(this.htmlprototype);
    this.element[0].container = this;
    if (this.required) this.element.addClass('seshet-input-required');
    if (parent.length === 1) this.element.addClass('seshet-input-alone'); 
    this.element.bind('input',scaleInputListener);
    this.element.bind('input',updateAnswerListener);
    this.element.bind('focus',updateCurrentFocus);
    if (content === undefined) content = '';
    this.setValue(content);
}

SeshetTextBox.prototype.htmlprototype = '<input class="seshet-text-box" size=1 type="text"></input>';

SeshetTextBox.prototype.setValue = function(value){
    this.element[0].value = value;
    scaleInput(this.element[0]);
}

SeshetTextBox.prototype.toString = function(){
    return this.element[0].value;
}
SeshetTextBox.prototype.getValue = function(value){
    return this.element[0].value;
}

SeshetTextBox.prototype.insertOperatorAtCursor = function (operator) {
    var ss = this.element[0].selectionStart;
    var se = this.element[0].selectionEnd;
    var initialValue = this.element[0].value;
    this.setValue(initialValue.slice(0,ss));
    var op = new operator(this.parent);
    op.list[0].list[0].setValue(initialValue.slice(ss,se));
    var nextTextBox = new SeshetTextBox(this.parent, false);
    nextTextBox.prevOperator = op;
    nextTextBox.element.bind('keydown',function (keyEvent) {op.deleteListener(op,keyEvent)});
    nextTextBox.setValue(initialValue.slice(se,initialValue.length));
    var index = this.parent.list.indexOf(this);
    this.parent.list.splice(index+1,0,op,nextTextBox);
    this.parent.length += 2;
    op.element.insertAfter(this.element);
    nextTextBox.element.insertAfter(op.element);
    this.element.removeClass('seshet-input-alone');
    this.root.updateAnswer();
    return op;
}

SeshetTermField = function (parent){
    this.parent = parent;
    this.root = parent.root;
    this.element = $(this.htmlprototype);
    this.length = 1;
    this.list = [new SeshetTextBox(this,true)];
    this.element.append(this.list[0].element);
}

SeshetTermField.prototype.htmlprototype = '<span class="seshet-term-field"></span>'
SeshetTermField.prototype.toString = function (){
    var output = "";
    for (var i = 0; i < this.length; i++) {
        output += this.list[i].toString();
    } 
    return output;
}

function SeshetInputLine(container, target){
    this.root = this;
    this.body = new SeshetTermField(this);
    this.target = target;
    this.element = $(this.htmlprototype);
    this.element.append(this.body.element);
    container.append(this.element);
}

SeshetInputLine.prototype.htmlprototype = '<span class="seshet-input-line"></span>'

SeshetInputLine.prototype.toString = function (){
    return this.body.toString();
}

SeshetInputLine.prototype.updateAnswer = function(){
    this.target[0].value = this.toString();
}

function scaleInput(target){
    var len = target.value.length;
    if (len > 0) {
        $(target).removeClass('seshet-input-empty');
        target.size = len;
    } else {
        $(target).addClass('seshet-input-empty');
        target.size = 1;
    }
}

function updateAnswerListener(event){
    event.target.container.root.updateAnswer();
}

var scaleInputListener= function(event){
    scaleInput(event.target);
}

function SeshetOperator (parent){
    this.parent = parent;
    this.root = parent.root;
    this.element = $(this.htmlprototype);
    var containers = this.element.find('.seshet-input-container');
    this.length = containers.length;
    this.list = [];
    for (var i=0; i<this.length; i++) {
        var j = new SeshetTermField(this);
        this.list.push(j);
        $(containers[i]).append(j.element);
    }
}

SeshetOperator.prototype.toString = function (){
    var l = this.list;
    function matchStringFormat(match, p1, offset, string){
        return '('+l[p1].toString()+')';
    }
    return this.strprototype.replace(/\{(\d)}/g,matchStringFormat);
}

SeshetOperator.prototype.delete = function (){
    var index = this.parent.list.indexOf(this);
    var prevBox = this.parent.list[index-1];
    var nextBox = this.parent.list[index+1];
    prevBox.setValue(prevBox.getValue()+nextBox.getValue());
    this.element.remove();
    nextBox.element.remove();
    this.parent.list.splice(index,2);
    this.parent.length -= 2;
    if (this.parent.list.length === 1) prevBox.element.addClass('seshet-input-alone');
}

SeshetOperator.prototype.deleteListener = function(op, keyEvent) {
    var target = keyEvent.target;
    var ss = target.selectionStart;
    if (keyEvent.keyCode === 8 & ss === 0){
        op.delete();
    }
}

SeshetOperator.prototype.infixDelete = function(){
    var new_l = [];
    for(var i=0;i<this.length;i++) {
        new_l = new_l.concat(this.list[i].list);
        // Need to join adjacent textboxes.
    }
    var index = this.parent.list.indexOf(this);
    var args = [index, 1].concat(new_l);
    this.parent.list = Array.prototype.splice.apply(this.parent.list, args);
    this.parent.length = this.parent.list.length;
    this.element.remove();
    // Need to join adjacent textboxes.
}

SeshetOperator.prototype.checkPattern = function(textblocks){
    if (textblocks.length <= this.length) return false; // Must have enough blocks to join this.length segments.
    if (!textblocks[0].endsWith(this.strcomponents[0])) return false;
    for (var i=1; i<this.length; i++){
        if(this.strcomponents[i] !== textblocks[i]) return false;
    }
    if (!textblocks[i].startsWith(this.strcomponents[i])) return false;
    return true;
}

function splitParens(input){
    var length = input.length;
    var outside_parens = [];
    var inside_parens = [];
    var depth = 0;
    var prev_paren = -1; // We add one for slicing.
    for (var i=0; i<length;i++){
        if (input[i] == "("){
            outside_parens.push(input.slice(prev_paren+1,i))
            prev_paren = i;
            for(var i=i;i<length;i++){
                if(input[i] == "("){
                    depth += 1;
                }
                else if (input[i] == ")"){
                    depth -= 1;
                    if (depth === 0){
                        inside_parens.push(input.slice(prev_paren+1,i))
                        prev_paren = i;
                        break;
                    }
                }
            }
            if (i==length){
                return false;
            }
        }
    }
    outside_parens.push(input.slice(prev_paren+1,length))
    return [outside_parens,inside_parens];
}

function SeshetInfixOp (parent){
    SeshetOperator.call(this,parent);
}
SeshetInfixOp.prototype = Object.create(SeshetOperator.prototype);
SeshetInfixOp.prototype.constructor = SeshetInfixOp;

function SeshetFraction (parent){
    SeshetInfixOp.call(this,parent);
}
SeshetFraction.prototype = Object.create(SeshetInfixOp.prototype);
SeshetFraction.prototype.constructor = SeshetFraction;

SeshetFraction.prototype.htmlprototype = '<table class="seshet-fraction"><tr><td class="seshet-fraction-numerator mathinput-fraction-ator"><span class="seshet-input-container" number="0" required="true"/></td></tr><tr><td class="seshet-fraction-denominator seshet-fraction-ator"><span class="seshet-input-container" number="1" required="true"/></td></tr></table>';
SeshetFraction.prototype.strprototype = '{0}/{1}';

function SeshetFraction (parent){
    SeshetInfixOp.call(this,parent);
}
SeshetFraction.prototype = Object.create(SeshetInfixOp.prototype);
SeshetFraction.prototype.constructor = SeshetFraction;

SeshetFraction.prototype.htmlprototype = '<table class="seshet-fraction"><tr><td class="seshet-fraction-numerator mathinput-fraction-ator"><span class="seshet-input-container" number="0" required="true"/></td></tr><tr><td class="seshet-fraction-denominator seshet-fraction-ator"><span class="seshet-input-container" number="1" required="true"/></td></tr></table>';
SeshetFraction.prototype.strprototype = '{0}/{1}';
SeshetFraction.prototype.strcomponents = ['','/',''];
SeshetFraction.prototype.length = 2;

function SeshetSqrt (parent){
    SeshetOperator.call(this,parent);
}
SeshetSqrt.prototype = Object.create(SeshetOperator.prototype);
SeshetSqrt.prototype.constructor = SeshetSqrt;

SeshetSqrt.prototype.htmlprototype = '<span class="seshet-sqrt"><span class="sqrt-symbol">√</span><span class="seshet-input-container seshet-sqrt-body"></span></span>'
SeshetSqrt.prototype.strprototype = ' sqrt{0}'
SeshetSqrt.prototype.strcomponents = [' sqrt',''];
SeshetSqrt.prototype.length = 1;

function SeshetParen (parent){
    SeshetOperator.call(this,parent);
}
SeshetParen.prototype = Object.create(SeshetOperator.prototype);
SeshetParen.prototype.constructor = SeshetParen;
SeshetParen.prototype.htmlprototype = '<span class="seshet-paren"><span class="paren left-paren">(</span><span class="seshet-input-container"></span><span class="paren right-paren">)</span></span>'
SeshetParen.prototype.strprototype = '{0}';
SeshetParen.prototype.length = 1;
SeshetParen.prototype.strcomponents = ['',''];

var operators = [SeshetFraction,SeshetSqrt,SeshetParen];
SeshetTermField.prototype.appendFromString = function(input){
    var texts,fields;
    [texts,fields] = splitParens(input);
    while(fields.length > 0){
        for(var i=0;i<operators.length;i++){
            var operator = operators[i];
            if (operator.prototype.checkPattern(texts)){
                lastBox = this.list[this.length-1];
                lastBox.element[0].selectionStart = lastBox.element[0].value.length;
                var op = lastBox.insertOperatorAtCursor(operator);
                for(var j=0;j<operator.prototype.length;j++){
                    text = texts.shift();
                    text = text.slice(0,text.length-op.strcomponents[j].length);
                    lastBox.setValue(lastBox.getValue()+text);
                    op.list[j].appendFromString(fields.shift());
                }
                break;
            }
        }
    }
    lastBox = this.list[this.length-1];
    lastBox.setValue(lastBox.getValue()+texts.shift());
    this.root.updateAnswer();
}