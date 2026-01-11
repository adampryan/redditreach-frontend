import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../../shared/services/authentication.service';

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      business_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirm: ['', [Validators.required]],
      website: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const passwordConfirm = form.get('password_confirm');

    if (password && passwordConfirm && password.value !== passwordConfirm.value) {
      passwordConfirm.setErrors({ passwordMismatch: true });
    } else if (passwordConfirm) {
      passwordConfirm.setErrors(null);
    }
    return null;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    const formData = this.signupForm.value;

    this.authService.register({
      email: formData.email,
      password: formData.password,
      password_confirm: formData.password_confirm,
      business_name: formData.business_name,
      website: formData.website || undefined
    }).subscribe({
      next: (response) => {
        // Load user profile after successful registration
        this.authService.loadUserProfile().subscribe({
          next: () => {
            this.toastr.success('Welcome to ThreadCatch! Let\'s get you set up.');
            this.router.navigate(['/dashboard'], { queryParams: { welcome: 'true' } });
          },
          error: () => {
            // Still navigate even if profile load fails - tokens are stored
            this.toastr.success('Account created! Welcome to ThreadCatch.');
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error) {
          // Handle specific validation errors
          if (err.error.email) {
            this.toastr.error(err.error.email[0] || 'Invalid email');
          } else if (err.error.password) {
            this.toastr.error(err.error.password[0] || 'Invalid password');
          } else if (err.error.password_confirm) {
            this.toastr.error(err.error.password_confirm[0] || 'Passwords do not match');
          } else if (err.error.business_name) {
            this.toastr.error(err.error.business_name[0] || 'Business name is required');
          } else {
            this.toastr.error('Registration failed. Please try again.');
          }
        } else {
          this.toastr.error('Registration failed. Please try again.');
        }
      }
    });
  }

  get business_name() { return this.signupForm.get('business_name'); }
  get email() { return this.signupForm.get('email'); }
  get password() { return this.signupForm.get('password'); }
  get password_confirm() { return this.signupForm.get('password_confirm'); }
  get website() { return this.signupForm.get('website'); }
}
