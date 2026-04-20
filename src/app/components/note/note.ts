import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DmnotesService } from '../../services/dmnotes.service';

@Component({
  selector: 'app-note',
  imports: [FormsModule],
  standalone: true,
  templateUrl: './note.html',
  styleUrl: './note.css',
})
export class Note {
  @Input() note!: any;
  @Input() sessionId!: string;
  @Output() delete = new EventEmitter<string>();

  constructor(private dmNotesService: DmnotesService) {}
  
  async update() {
    if (!this.note.id) return;

    if (this.note.id) {
      await this.dmNotesService.updateNote(
        this.sessionId,
        this.note.id,
        {
          title: this.note.title,
          content: this.note.content
        }
      );
    }
  }

  async onDelete() {
    if (!this.note.id) return;
    this.delete.emit(this.note.id);
  }

}
