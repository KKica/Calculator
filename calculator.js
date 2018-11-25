String.prototype.replace=function(s,index,numberOfChars=1){
    return this.substr(0,index)+s+this.substr(index+numberOfChars);
}

var evaluate= function(expression){
    var s=expression;
    try{
        //substitute math functions to their Javascript counterparts
        s=substituteFunction(s,"sin(",")","Math.sin((",")*Math.PI/180)",0);
        s=substituteFunction(s,"cos(",")","Math.cos((",")*Math.PI/180)",0);
        s=substituteFunction(s,"|","|","Math.abs(",")",0);
        s=parsePower(s);//only operator not supported by eval
        if(s){
            s=addMultipextionSign(s);
            console.log("Evaluating expression:"+ s);
            return eval(s);
        }
        return undefined;
    }
    catch(ex){
        return undefined;
    }
}
module.exports=evaluate;

// turns math functions in their corresponding javascript functions
function substituteFunction(s,beforeStartSymbols,beforeEndSymbols,afterStartSymbols,afterEndSymbols,indexToStart=0){
    var startIndex=s.indexOf(beforeStartSymbols,indexToStart);
    var endIndex=s.indexOf(beforeEndSymbols,startIndex+1);

    //brackets and Math functions can't end with an operator
    while(endIndex>0&&isOperator(s.charAt(endIndex-1)))
    {
        endIndex=s.indexOf(beforeEndSymbols,endIndex+1);
    }

    //here we have a possible Math function or brackets because we have found 
    //the start end end symobols for the function/brackets
    while(startIndex>=0&&endIndex>0){

        //keeping track of brackets and absolute value signs as a inside a function
        //or brackets cannot be more opening than closing brackets and vice-versa
        var bracketsNotClosed=0,vleraAbsNotClosed=0;// brackets and || for absolute value
        for(var i=startIndex;i<=endIndex;i++){
            if(s.charAt(i)=="(")
            bracketsNotClosed++;
            else if(s.charAt(i)==")")
            bracketsNotClosed--;
            else if(s.charAt(i)=="|")
            vleraAbsNotClosed++;
        }
        //correct number of brackets
        if(bracketsNotClosed===0&&vleraAbsNotClosed%2===0){
            //Change math functions to functions Javascript equivalent Math functions
            s=s.replace(afterStartSymbols,startIndex,beforeStartSymbols.length);
            s=s.replace(afterEndSymbols,endIndex+afterStartSymbols.length-beforeStartSymbols.length,beforeEndSymbols.length);

            //Do the same for the part inside the function or after it.
            var newIndexToStart=startIndex+afterStartSymbols.length-beforeStartSymbols.length;
            return substituteFunction(s,beforeStartSymbols,beforeEndSymbols,afterStartSymbols,afterEndSymbols,newIndexToStart+1);
        }
        else //the closing symbols are not the correct ones
            endIndex=s.indexOf(beforeEndSymbols,endIndex+1);

    }
    return s;
}

//adds missing * operator where neccesary
function addMultipextionSign(s){
    s=addMultipextionSignBeforeNAN(s,"(");
    s=addMultipextionSignBeforeNAN(s,"Math");
    s=addMultipextionSignBeforeNumbers(s);   
    return s;
}

//adds missing * before symbols that are not numbers eg."Math","(" 
function addMultipextionSignBeforeNAN(s,before){
    if(!isNaN(before.charAt(0)))
        return s;
    for(var i=1;i<s.length&&i>=0;i++)
    {
        i=s.indexOf(before,i);
        if(i==-1)
            break;
        if(!isOneOf(s.charAt(i-1),["*","^","+","-","/",'|',"("])&&!isLetter(s.charAt(i-1)))
        {
            s=s.substr(0,i)+"*"+s.substr(i);
            i++;
        }
    }
    return s;
}

//adds missing * before numbers
function addMultipextionSignBeforeNumbers(s){
    for(var i=1;i<s.length&&i>=0;i++)
    {
        if(!isNaN(s.charAt(i))&&s.charAt(i-1)===")")
        {
            s=s.substr(0,i)+"*"+s.substr(i);
            i++;
        }
    }
    return s;
}


function parsePower(expression){
    var StartSymbol="Math.pow(", endSymbol=")";
    for(var i=0;i<expression.length;i++){
        if(expression.charAt(i)==='^')
        {
            var startingIndexOfFirstOperand=findStartingIndexOfFirstOperand(i,'^',expression);
            if(startingIndexOfFirstOperand===-1)
                return undefined;
            expression=expression.replace(StartSymbol,startingIndexOfFirstOperand,0);
            var endingIndexOfSecondOperand=findEndingIndexOfSecondOperand(i+StartSymbol.length,'^',expression);
            if(endingIndexOfSecondOperand===-1)
                return undefined;
            expression=expression.replace(",",i+StartSymbol.length,1);
            expression=expression.replace(endSymbol,endingIndexOfSecondOperand+1,0);
            i=i+StartSymbol.length;
        }
    }
    return expression;
}


// expression=...FOS... where O is the operator, F is the first operand (base) and S the second (exponent)
function findEndingIndexOfSecondOperand(indexOfOperator,operator,expression){
    if(!expression||!operator||operator.length!=1||indexOfOperator<1||expression.length<=indexOfOperator)
        return -1;
    //supports only the power operator as the others are supported by eval    
    if(operator=='^'){
        var i;
        if(!isNaN(expression.charAt(indexOfOperator+1))){//S is a number
            for(i=indexOfOperator+1;i<expression.length&&!isNaN(expression.charAt(i));i++);
            return i-1;
        }
        i=indexOfOperator+1;
        //S is the result math of a math function starting with letters eg. sin, cos
        while(i<expression.length && isLetter(expression.charAt(i))){
            i++;
        }
        //S is an expression surronded by brackets, or we have arrived at the brackets part of a math function
        // eg. sin(5+3) and i is the index of "("
         if(isOneOf(expression.charAt(i),["(","|"])){//there must be an opening bracket or "|"here
            var bracketsNotClosed=0,vleraAbsNotClosed=0;// brackets and || for absolute value
            //find the index of the corresponding bracket
            for(;i<expression.length;i++){
                if(expression.charAt(i)=="(")
                bracketsNotClosed++;
                else if(expression.charAt(i)==")")
                bracketsNotClosed--;
                else if(expression.charAt(i)=="|")
                vleraAbsNotClosed++;
                if(bracketsNotClosed==0&&vleraAbsNotClosed%2==0)
                    return i;
            }//end for loop
        }   //end operator is following one of "(","|"
    }   
    return -1;
}

// expression=...FOS... where O is the operator, F is the first operand (base) and S the second (exponent)
function findStartingIndexOfFirstOperand(indexOfOperator,operator,expression){
    if(!expression||!operator||operator.length!=1||indexOfOperator<1||expression.length<=indexOfOperator)
        return -1;
    if(operator=='^'){
        var i;
        //first operand is a number
        if(!isNaN(expression.charAt(indexOfOperator-1))){
            for(i=indexOfOperator-1;i>-1&&!isNaN(expression.charAt(i));i--);
            return i+1;
        }
        // first operand is the result of a math function or expression in brackets
        if(isOneOf(expression.charAt(indexOfOperator-1),[")","|"])){
            var bracketsNotClosed=0,vleraAbsNotClosed=0;// brackets and || for absolute value
            for(i=indexOfOperator-1;i>-1;i--){
                if(expression.charAt(i)=="(")
                bracketsNotClosed++;
                else if(expression.charAt(i)==")")
                bracketsNotClosed--;
                else if(expression.charAt(i)=="|")
                vleraAbsNotClosed++;
                if(bracketsNotClosed==0&&vleraAbsNotClosed%2==0){//found the opening bracket
                    while(--i>-1&&isLetter(expression.charAt(i)));//if F is the result of a math function
                    return i+1;
                }//end if
                
            }//end for loop
        }   //end operator is following one of ")","|"
    }// end kind of operator
    return -1;
}


//check if char is an element of the array
function isOneOf(char,array){
    for(var i=0;i<array.length;i++)
        if(char==array[i])
            return true;
    return false;
}


//find if character is a letter
function isLetter(c){
    return c &&c.length==1 && c.toLowerCase()!=c.toUpperCase();
}

//Find if char is a math operator
function isOperator(c){
    return isOneOf(c,["*","^","+","-","/"]);
}
