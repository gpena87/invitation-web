import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { UsersService } from '../../services/users.service';
// import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent {
  // private readonly sanitizer = inject(DomSanitizer);
  // protected readonly spotifyPlaylistUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
  //   'https://open.spotify.com/embed/playlist/6IOJDEwrxWtqhVu6YN4POd?utm_source=generator'
  // );

  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isSubmitting = signal(false);
  readonly isSuccessModalOpen = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly userForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    numberPhone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    restriccion: [''],
    confirmation: ['', Validators.required]
  });

  constructor() {
    this.userForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.successMessage()) {
        this.successMessage.set(null);
        this.isSuccessModalOpen.set(false);
      }
    });
  }

  closeSuccessPopup(): void {
    this.isSuccessModalOpen.set(false);
    this.successMessage.set(null);
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    const { confirmation, ...rest } = this.userForm.getRawValue();
    const payload = { ...rest, confirmation: confirmation === 'true' };

    this.usersService
      .createUser(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.userForm.reset({
            name: '',
            lastName: '',
            email: '',
            numberPhone: '',
            restriccion: '',
            confirmation: ''
          }, { emitEvent: false });
          this.successMessage.set('Registro enviado correctamente.');
          this.isSuccessModalOpen.set(true);
        },
        error: (error: HttpErrorResponse) => {
          console.log('error', error);
          if (error.status === 0) {
            this.errorMessage.set(
              'Error intenta más tarde'
            );
            return;
          }

          const apiMessage =
            typeof error.error === 'object' && error.error !== null && 'message' in error.error
              ? String(error.error.message)
              : null;

          this.errorMessage.set(apiMessage ?? 'No se pudo enviar el formulario. Intentalo nuevamente.');
        }
      });
  }
}
