export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero')
  }
  return a / b
}

// Complex function for testing complexity analysis
export function complexFunction(data: any[]): any {
  if (!data || data.length === 0) {
    return null
  }
  
  let result = []
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === 'A') {
      if (data[i].value > 10) {
        result.push(data[i].value * 2)
      } else {
        result.push(data[i].value)
      }
    } else if (data[i].type === 'B') {
      if (data[i].value < 5) {
        result.push(data[i].value / 2)
      } else {
        result.push(data[i].value + 1)
      }
    } else {
      result.push(0)
    }
  }
  
  return result
}
