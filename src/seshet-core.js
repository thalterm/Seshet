(function(seshet, $, undefined){
    seshet.Focus = null;
    updateCurrentFocus = function(event) {
        seshet.Focus = event.target.container;
    }

    seshet.TextBox = function(parent, required, content){
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
        this.element.bind('keydown',this.arrowListener);
        if (content === undefined) content = '';
        this.setValue(content);
    }

    seshet.TextBox.prototype.htmlprototype = '<input class="seshet-text-box" size=1 type="text"></input>';

    seshet.TextBox.prototype.setValue = function(value){
        this.element[0].value = value;
        scaleInput(this.element[0]);
    }

    seshet.TextBox.prototype.toString = function(){
        return this.element[0].value;
    }
    seshet.TextBox.prototype.getValue = function(value){
        return this.element[0].value;
    }

    seshet.TextBox.prototype.insertOperatorAtEnd = function (operator) {
        var nextTextBox = new seshet.TextBox(this.parent, false);
        var op = new operator(this.parent);
        nextTextBox.prev = op.list[op.length-1].list[0];
        nextTextBox.prev.next = nextTextBox;
        nextTextBox.next = this.next;
        if (nextTextBox.next) nextTextBox.next.prev = nextTextBox;
        this.next = op.list[0].list[0];
        this.next.prev = this;
        op.nextTextBox = nextTextBox;
        nextTextBox.prevOperator = op;
        
        nextTextBox.element.bind('keydown',function (keyEvent) {op.deleteListener(op,keyEvent)});
        var index = this.parent.list.indexOf(this);
        this.parent.length += 2;
        this.parent.list.splice(index+1,0,op,nextTextBox);
        op.element.insertAfter(this.element);
        nextTextBox.element.insertAfter(op.element);
        this.element.removeClass('seshet-input-alone');
        this.root.updateAnswer();
        return op;
    }

    seshet.insertOperatorAtCursor = function (operator) {
        var ss = seshet.Focus.element[0].selectionStart;
        var se = seshet.Focus.element[0].selectionEnd;
        var initialValue = seshet.Focus.element[0].value;
        seshet.Focus.setValue(initialValue.slice(0,ss));
        var op = seshet.Focus.insertOperatorAtEnd(operator);
        op.list[0].list[0].setValue(initialValue.slice(ss,se));
        op.nextTextBox.setValue(initialValue.slice(se,initialValue.length));
        var index = seshet.Focus.parent.list.indexOf(seshet.Focus);
        seshet.Focus.parent.list.splice(index+1,0,op,op.nextTextBox);
        op.list[0].list[0].element.focus();
        return op;
    }

    seshet.TermField = function (parent){
        this.parent = parent;
        this.root = parent.root;
        this.element = $(this.htmlprototype);
        this.length = 1;
        this.list = [new seshet.TextBox(this,true)];
        this.element.append(this.list[0].element);
    }

    seshet.TermField.prototype.htmlprototype = '<span class="seshet-term-field"></span>'
    seshet.TermField.prototype.toString = function (){
        var output = "";
        for (var i = 0; i < this.length; i++) {
            output += this.list[i].toString();
        } 
        return output;
    }

    seshet.InputLine = function (container, target){
        this.root = this;
        this.body = new seshet.TermField(this);
        this.target = target;
        this.element = $(this.htmlprototype);
        this.element.append(this.body.element);
        if (this.target[0].value !== ""){
            this.body.appendFromString(this.target[0].value);
        } 
        container.append(this.element);
    }

    seshet.InputLine.prototype.htmlprototype = '<span class="seshet-input-line"></span>'

    seshet.InputLine.prototype.toString = function (){
        return this.body.toString();
    }

    seshet.InputLine.prototype.updateAnswer = function(){
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

    seshet.Operator = function(parent){
        this.parent = parent;
        this.root = parent.root;
        this.element = $(this.htmlprototype);
        var containers = this.element.find('.seshet-input-container');
        this.length = containers.length;
        this.list = [];
        prev = null;
        for (var i=0; i<this.length; i++) {
            var j = new seshet.TermField(this);
            j.list[0].prev=prev;
            if(prev) prev.next=j.list[0];
            this.list.push(j);
            $(containers[i]).append(j.element);
            prev = j.list[0];
        }
    }

    seshet.Operator.prototype.toString = function (){
        var l = this.list;
        function matchStringFormat(match, p1, offset, string){
            return '('+l[p1].toString()+')';
        }
        return this.strprototype.replace(/\{(\d)}/g,matchStringFormat);
    }

    seshet.Operator.prototype.delete = function (){
        var index = this.parent.list.indexOf(this);
        var prevBox = this.parent.list[index-1];
        var nextBox = this.parent.list[index+1];
        prevBox.next = nextBox.next;
        prevBox.next.prev = prevBox;
        prevBox.setValue(prevBox.getValue()+nextBox.getValue());
        this.element.remove();
        nextBox.element.remove();
        this.parent.list.splice(index,2);
        this.parent.length -= 2;
        if (this.parent.list.length === 1) prevBox.element.addClass('seshet-input-alone');
    }

    seshet.Operator.prototype.deleteListener = function(op, keyEvent) {
        var target = keyEvent.target;
        var ss = target.selectionStart;
        if (keyEvent.keyCode === 8 & ss === 0){
            op.delete();
        }
    }

    seshet.TextBox.prototype.arrowListener = function(keyEvent){
        var target = keyEvent.target;
        var ss = target.selectionStart;
        var se = target.selectionEnd;
        if (ss == se){
            if (keyEvent.keyCode === 37 && ss === 0 && target.container.prev){
                focus = target.container.prev.element;
                focus.focus();
                focus[0].selectionStart = focus[0].value.length;
                keyEvent.preventDefault();
            }
            else if(keyEvent.keyCode === 39 && ss === target.value.length && target.container.next){
                focus = target.container.next.element;
                focus.focus();
                focus[0].selectionEnd = 0;
                keyEvent.preventDefault();
            }
        }
    }

    seshet.Operator.prototype.infixDelete = function(){
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

    seshet.Operator.prototype.checkPattern = function(textblocks){
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

    seshet.InfixOp = function (parent){
        seshet.Operator.call(this,parent);
    }
    seshet.InfixOp.prototype = Object.create(seshet.Operator.prototype);
    seshet.InfixOp.prototype.constructor = seshet.InfixOp;

    seshet.operators = [];
    seshet.operators.registerOperator = function (name, htmlprototype, strprototype){
        seshet.operators[name] = function (parent){
            seshet.Operator.call(this,parent);
        }
        var op = seshet.operators[name];
        op.prototype = Object.create(seshet.Operator.prototype);
        op.prototype.constructor = seshet.operators[name];
        op.prototype.htmlprototype = htmlprototype;
        op.prototype.strprototype = strprototype;
        op.prototype.strcomponents = strprototype.split(/\{[0-9]*\}/);
        op.prototype.length = op.prototype.strcomponents.length-1;
        seshet.operators.unshift(op);
        return op;
    }
    seshet.TermField.prototype.appendFromString = function(input){
        var texts,fields;
        [texts,fields] = splitParens(input);
        while(fields.length > 0){
            for(var i=0;i<seshet.operators.length;i++){
                var operator = seshet.operators[i];
                if (operator.prototype.checkPattern(texts)){
                    lastBox = this.list[this.length-1];
                    var op = lastBox.insertOperatorAtEnd(operator);
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
}( window.seshet = window.seshet || {}, jQuery));