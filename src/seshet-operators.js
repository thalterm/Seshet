/* seshet-operators.js populates the seshet.operators list/dictionary.

Invoke seshet.operators.registerOperator(name, htmlprototype,strprototype) with:

name is the name of the operator. Subsequently, the operator can be referred to by
seshet.operators["name"] or seshet.operators.name

htmlprototype a string for HTML display with a surrounding tag and innermost 
    <span class=seshet-input-container"></span>
for each input.

strprototype a string for formatted output with
 {0}
 {1}
 ...
for each input.
* Currently, it requires the inputs to be represented once
* in order
* and with no optional arguments.
Those restrictions are likely to be lifted.

Add new operators to the bottom of the list.
Style operators in seshet-operators.css
*/

(function(seshet, $, undefined){
    
    seshet.operators.registerOperator("Paren",
    '<span class="seshet-paren"><span class="seshet-input-container"></span></span>',
    '{0}');

    seshet.operators.registerOperator("Fraction",
    '<table class="seshet-fraction"><tr><td class="seshet-fraction-numerator mathinput-fraction-ator"><span class="seshet-input-container" number="0" required="true"/></td></tr><tr><td class="seshet-fraction-denominator seshet-fraction-ator"><span class="seshet-input-container" number="1" required="true"/></td></tr></table>',
    '{0}/{1}');

    seshet.operators.registerOperator("Sqrt",
    '<span class="seshet-sqrt"><span class="sqrt-symbol"></span><span class="seshet-input-container seshet-sqrt-body"></span></span>',
    ' sqrt{0}');

    seshet.operators.registerOperator("Exponent",
    '<span class="seshet-exponent"><sup><span class="seshet-input-container"></span></sup></span>',
    '^{0}');
    
    seshet.operators.registerOperator("Sqrt2",
    '<span class="seshet-sqrt"><span class="sqrt-symbol"></span><span class="seshet-input-container seshet-sqrt-body"></span></span>',
    ' sqrt{0}');

}( window.seshet = window.seshet || {}, jQuery));
