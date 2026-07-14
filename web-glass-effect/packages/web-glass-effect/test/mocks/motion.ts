export class MotionValue<T> {
  private value: T;

  constructor(initialValue: T) {
    this.value = initialValue;
  }

  get() {
    return this.value;
  }

  set(nextValue: T) {
    this.value = nextValue;
  }
}
