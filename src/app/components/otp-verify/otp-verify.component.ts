import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './otp-verify.component.html',
  styleUrls: ['./otp-verify.component.scss']
})
export class OtpVerifyComponent implements OnInit,OnDestroy {
  otpForm: FormGroup;
  isLoading = false;  
  timeLeft = 120; // Default time in seconds
  timer: any;
  digits = new Array(6).fill('');
  email: string ='';

  constructor(
    private fb: FormBuilder,
    private router:ActivatedRoute,
    private Router: Router,   
    private userService: UserService
  ) {
    const group: any = {};
    for (let i = 0; i < 6; i++) {
      group[`digit${i}`] = ['', [Validators.required, Validators.pattern('^[0-9]$')]];
    }
    this.otpForm = this.fb.group(group);

    this.initializeTimer();
  }

  ngOnInit(): void {
    this.router.params.subscribe(params => {
      this.email = params['email'];
      console.log("email",this.email);
    });
  }
  // Timer Initialization Logic
  initializeTimer() {
    const storedTime = localStorage.getItem('otpTimer');
    const storedTimestamp = localStorage.getItem('otpTimestamp');

    if (storedTime && storedTimestamp) {
      const elapsedTime = Math.floor((Date.now() - parseInt(storedTimestamp, 10)) / 1000);
      this.timeLeft = Math.max(parseInt(storedTime, 10) - elapsedTime, 0);
    }

    if (this.timeLeft > 0) {
      this.startResendTimer();
    }
  }

  // Start or Continue Timer
  startResendTimer() {
    localStorage.setItem('otpTimestamp', Date.now().toString());
    localStorage.setItem('otpTimer', this.timeLeft.toString());

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        localStorage.setItem('otpTimer', this.timeLeft.toString());
      } else {
        clearInterval(this.timer);
        localStorage.removeItem('otpTimer');
        localStorage.removeItem('otpTimestamp');
      }
    }, 1000);
  }

  // Resend OTP Logic
  async resendOtp() {
    if (this.timeLeft === 0) {
      try {
        await this.userService.resendOtp().toPromise();
        this.timeLeft = 120; // Reset timer
        this.startResendTimer();
      } catch (error) {
        console.error('Failed to resend OTP:', error);
      }
    }
  }

  // Submit OTP
  async onSubmit() {
    if (this.otpForm.valid) {
      this.isLoading = true;
      try {
        const otp = Object.values(this.otpForm.value).join('');
        await this.userService.verifyOtp(otp,this.email).toPromise();
        this.Router.navigate(['/otpSuccess']);
      } catch (error) {
        console.error('OTP verification failed:', error);  
      } finally {
        this.isLoading = false;
      }
    }
  } 

  // Handle User Input for OTP
  handleInput(event: Event, currentIndex: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    if (value.length > 1) {
      const lastChar = value.slice(-1);
      input.value = lastChar;
      this.otpForm.get(`digit${currentIndex}`)?.setValue(lastChar);
    } else {
      this.otpForm.get(`digit${currentIndex}`)?.setValue(value);
    }

    if (value && currentIndex < 5) {
      const nextInput = this.getInput(currentIndex + 1);
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  // Handle Key Down Events
  handleKeydown(event: KeyboardEvent, currentIndex: number) {
    const input = event.target as HTMLInputElement;

    switch (event.key) {
      case 'Backspace':
        event.preventDefault();
        if (input.value) {
          input.value = '';
          this.otpForm.get(`digit${currentIndex}`)?.setValue('');
        } else if (currentIndex > 0) {
          const prevInput = this.getInput(currentIndex - 1);
          if (prevInput) {
            prevInput.focus();
            prevInput.value = '';
            this.otpForm.get(`digit${currentIndex - 1}`)?.setValue('');
          }
        }
        break;

      case 'ArrowLeft':
        if (currentIndex > 0) {
          event.preventDefault();
          this.getInput(currentIndex - 1)?.focus();
        }
        break;

      case 'ArrowRight':
        if (currentIndex < 5) {
          event.preventDefault();
          this.getInput(currentIndex + 1)?.focus();
        }
        break;

      default:
        if (!/^\d$/.test(event.key) && !['Tab', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
        }
        break;
    }
  }

  // Handle Paste Event
  handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');

    if (pastedData) {
      const numbers = pastedData.match(/\d/g);
      if (numbers) {
        numbers.slice(0, 6).forEach((num, index) => {
          this.otpForm.get(`digit${index}`)?.setValue(num);
          const input = this.getInput(index);
          if (input) {
            input.value = num;
          }
        });
        const lastFilledIndex = Math.min(numbers.length, 6) - 1;
        this.getInput(lastFilledIndex)?.focus();
      }
    }
  }

  private getInput(index: number): HTMLInputElement | null {
    return document.querySelector(`input[data-index="${index}"]`);
  }

  // Input Focus Logic
  inputFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  // Cleanup Timer on Component Destruction
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
