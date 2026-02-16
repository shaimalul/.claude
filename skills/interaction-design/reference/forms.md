# Form UX Patterns

## Table of Contents

- [Form Field Hook](#form-field-hook)
- [Submit Button States](#submit-button-states)
- [Multi-Step Forms](#multi-step-forms)

---

## Form Field Hook

```tsx
const useFormField = <T extends string>(
  validate: (value: T) => string | null
) => {
  const [value, setValue] = useState<T>('' as T);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = (newValue: T) => {
    setValue(newValue);
    // Clear error while typing if user is fixing it
    if (error && touched) {
      setError(validate(newValue));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(value));
  };

  return {
    value,
    error: touched ? error : null,
    onChange: handleChange,
    onBlur: handleBlur,
    reset: () => {
      setValue('' as T);
      setError(null);
      setTouched(false);
    },
  };
};
```

## Submit Button States

```tsx
type SubmitState = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

const SubmitButton: React.FC<{
  state: SubmitState;
  isValid: boolean;
}> = ({ state, isValid }) => {
  const isDisabled = !isValid || state === 'submitting' || state === 'validating';

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={state === 'submitting'}
    >
      {state === 'submitting' && <Spinner aria-hidden="true" />}
      {state === 'submitting' ? 'Submitting...' : 'Submit'}
    </button>
  );
};
```

## Multi-Step Forms

### Stepper Component

```tsx
interface Step {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

const Stepper: React.FC<{ steps: Step[] }> = ({ steps }) => (
  <nav aria-label="Form progress">
    <ol className="stepper">
      {steps.map((step, index) => (
        <li
          key={step.id}
          aria-current={step.status === 'current' ? 'step' : undefined}
          className={`step step-${step.status}`}
        >
          <span className="step-number" aria-hidden="true">
            {step.status === 'complete' ? <CheckIcon /> : index + 1}
          </span>
          <span className="step-label">{step.label}</span>
          <span className="sr-only">
            {step.status === 'complete' ? '(completed)' : ''}
            {step.status === 'current' ? '(current step)' : ''}
          </span>
        </li>
      ))}
    </ol>
  </nav>
);
```

Guidelines:
- Show progress clearly
- Allow going back to previous steps
- Save drafts between steps when possible
- Validate each step before proceeding
