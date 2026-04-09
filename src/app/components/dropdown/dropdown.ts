import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Dropdown),
      multi: true
    }
  ]
})
export class Dropdown implements ControlValueAccessor, OnInit {
  @Input() label: string = '';
  @Input() options: { value: any, label: string }[] = [];
  @Input() placeholder: string = 'Selecciona una opción';
  @Input() disabled: boolean = false;

  selectedValue: any;
  onChange: any = () => {};
  onTouched: any = () => {};

  ngOnInit() {
    if (!this.options) {
      console.warn('Dropdown: No se proporcionaron opciones');
      this.options = [];
    }
  }


  writeValue(value: any): void {
    this.selectedValue = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectChange(event: any): void {
    this.selectedValue = event.target.value;
    this.onChange(this.selectedValue);
    this.onTouched();
  }

}
