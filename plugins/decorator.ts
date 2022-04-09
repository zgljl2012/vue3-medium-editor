
export function logger(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;

  descriptor.value = function (...args) {
    console.log('params: ', ...args);
    const result = original.call(this, ...args);
    console.log('result: ', result);
    return result;
  }
}

export function timer(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args) {
    // 毫秒级别计时
    const start_at = performance.now()
    const result = original.call(this, ...args);
    const end_at = performance.now()
    console.log(`${propertyKey}: ${end_at - start_at}ms`)
    return result;
  }
}
