import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-note',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './note.html',
  styleUrl: './note.css',
})
export class Note {
  @Input() note!: any;
  @Output() delete = new EventEmitter<number>();
  
  onDelete() {
    this.delete.emit(this.note.id);
  }

}
