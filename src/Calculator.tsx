import React, { useEffect, useState } from 'react';
import DigitButton from './components/DigitButton';
import OperatorButton from './components/OperatorButton';
import Operator from './types';

const ERROR_MESSAGE = {
  NOT_NUMBER: '숫자 아님',
  INFINITY_NUMBER: '오류',
  NOT_OPERATOR: '유효한 연산자가 아닙니다',
  INPUT_ORDER: '숫자를 먼저 입력해 주세요',
  MAX_DIGIT: '최대 세자리 숫자까지만 입력이 됩니다.',
  MULTIPLE_OPERATOR: '연산자를 연속적으로 입력할 수 없습니다',
};

const operators: Array<Operator> = [Operator.plus, Operator.minus, Operator.multiply, Operator.divide];

// [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const DIGITS = Array.from({ length: 10 }, (_, i) => ({ id: i, digit: 9 - i }));

const arithmeticOperation = {
  plus: (num1: number, num2: number) => num1 + num2,
  minus: (num1: number, num2: number) => num1 - num2,
  multiply: (num1: number, num2: number) => num1 * num2,
  divide: (num1: number, num2: number) => num1 / num2,
};

const operatorMap = {
  [Operator.plus]: arithmeticOperation.plus,
  [Operator.minus]: arithmeticOperation.minus,
  [Operator.multiply]: arithmeticOperation.multiply,
  [Operator.divide]: arithmeticOperation.divide,
};

type CalculatorState = {
  prevNumber: null | number;
  nextNumber: null | number;
  operator: null | Operator;
  result: string;
  completed: boolean;
};

const initialState: CalculatorState = {
  prevNumber: null,
  nextNumber: null,
  operator: null,
  result: '0',
  completed: false,
};

const localStorageKey = 'calculator-localstorage-key';

const errorState = (errorMessage: string): CalculatorState => ({
  ...initialState,
  result: errorMessage,
});

function Calculator() {
  const [prevNumber, setPrevNumber] = useState<CalculatorState['prevNumber']>(null);
  const [nextNumber, setNextNumber] = useState<CalculatorState['nextNumber']>(null);
  const [operator, setOperator] = useState<CalculatorState['operator']>(null);
  const [result, setResult] = useState<CalculatorState['result']>('');
  const [completed, setCompleted] = useState<CalculatorState['completed']>(false);

  useEffect(() => {
    const localState = JSON.parse(localStorage.getItem(localStorageKey) || JSON.stringify(initialState));
    setPrevNumber(Number(localState.prevNumber)); // Number(null) === 0;
    setNextNumber(Number(localState.nextNumber));
    setOperator(localState.operator);
    setResult(localState.result);
    setCompleted(localState.completed);
  }, []);

  useEffect(() => {
    const saveCurrentStateBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          prevNumber,
          nextNumber,
          operator,
          result,
          completed,
        }),
      );
    };
    window.addEventListener('beforeunload', saveCurrentStateBeforeLeave);
    return () => window.removeEventListener('beforeunload', saveCurrentStateBeforeLeave);
  }, [prevNumber, nextNumber, operator, result, completed]);

  const reset = () => {
    setPrevNumber(initialState.prevNumber);
    setNextNumber(initialState.nextNumber);
    setOperator(initialState.operator);
    setResult(initialState.result);
    setCompleted(initialState.completed);
  };

  const handleClickDigitBtn = (digit: number) => {
    const isPrevNumberTurn = operator === null;
    const targetNumber = isPrevNumberTurn ? prevNumber : nextNumber;

    // =를 눌러서 연산이 끝났는데 또 숫자를 누르면 초기화를 한다
    if (completed) {
      reset();
      return;
    }

    // 첫번째 피연산자 혹은 두번째 피연산자의 길이가 3을 초과하면 에러를 띄운다
    if (`${targetNumber ?? ''}`.length >= 3) {
      window.alert(ERROR_MESSAGE.MAX_DIGIT);
      return;
    }

    if (isPrevNumberTurn) {
      const newNumber = Number(`${prevNumber ?? ''}${digit}`);
      setPrevNumber(newNumber);
      setResult(`${newNumber}`);
      return;
    }

    const newNumber = `${nextNumber ?? ''}${digit}`;
    setNextNumber(Number(newNumber));
    setResult(`${prevNumber}${operator}${newNumber}`);
  };

  const handleClickOperatorBtn = (_operator: Operator) => {
    if (operator) {
      window.alert(ERROR_MESSAGE.MULTIPLE_OPERATOR);
      return;
    }

    const isValidOperator = Object.values(Operator).includes(_operator);
    if (!isValidOperator) {
      setResult(ERROR_MESSAGE.NOT_OPERATOR);
      return;
    }
    if (prevNumber === null) {
      setResult(ERROR_MESSAGE.INPUT_ORDER);
      return;
    }

    setOperator(_operator);
    setResult(`${prevNumber}${_operator}`);
    setCompleted(false);
  };

  const handleClickCalculateBtn = () => {
    console.log(prevNumber, operator, nextNumber);
    if (prevNumber === null) return;
    if (operator === null) return;
    if (nextNumber === null) {
      setOperator(null);
      return;
    }

    const operatorFn = operatorMap[operator];
    if (operatorFn === null) return;

    const newResult = Math.floor(operatorFn(prevNumber, nextNumber));
    if (Number.isNaN(newResult)) {
      setResult(ERROR_MESSAGE.NOT_NUMBER);
      return;
    }
    if (!Number.isFinite(newResult)) {
      setResult(ERROR_MESSAGE.INFINITY_NUMBER);
      return;
    }

    setPrevNumber(newResult);
    setNextNumber(null);
    setOperator(null);
    setResult(`${newResult}`);
    setCompleted(true);
  };

  const handleClickResetBtn = () => reset();

  return (
    <div className="calculator">
      <h1 id="total">{result}</h1>
      <div className="digits flex">
        {DIGITS.map(({ id, digit }) => (
          <DigitButton key={id} onClick={handleClickDigitBtn} digit={digit} />
        ))}
      </div>
      <div className="modifiers subgrid">
        <button className="modifier" type="button" onClick={handleClickResetBtn}>
          AC
        </button>
      </div>
      <div className="operations subgrid">
        {operators.map(_operator => (
          <OperatorButton
            key={_operator}
            isFocused={operator === _operator}
            operator={_operator}
            onClick={handleClickOperatorBtn}
          />
        ))}
        <button id="calculate-equal" className="operation" type="button" onClick={handleClickCalculateBtn}>
          =
        </button>
      </div>
    </div>
  );
}

export default Calculator;
