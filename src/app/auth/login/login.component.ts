import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../../shared/services/authentication.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  returnUrl = '/dashboard';
  sessionExpired = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.sessionExpired = this.route.snapshot.queryParams['sessionExpired'] === 'true';

    if (this.sessionExpired) {
      this.toastr.warning('Your session has expired. Please log in again.');
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        // Load user profile after successful login
        this.authService.loadUserProfile().subscribe({
          next: () => {
            this.toastr.success('Welcome back!');
            this.router.navigateByUrl(this.returnUrl);
          },
          error: (err) => {
            this.isLoading = false;
            this.toastr.error('Failed to load user profile');
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.toastr.error('Invalid email or password');
        } else {
          this.toastr.error('Login failed. Please try again.');
        }
      }
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
