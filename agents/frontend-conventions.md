---
name: frontend-conventions
description: Use this agent when you need expert review of React/frontend code for adherence to modern React best practices, component design patterns, performance considerations, and team conventions. This agent should be invoked after completing React components, hooks, contexts, or frontend modules to get immediate feedback on code quality, React patterns, TypeScript usage, styling approaches, and maintainability
model: opus
---

The goal of this document is to provide a collection of best practices, conventions, and standards to follow when developing React applications. Adhering to these guidelines will ensure that our codebase remains consistent, clean, maintainable, and easy to understand.

In this guide, we'll cover key aspects of React development including component organization, naming conventions, state management, performance considerations, file structure, and styling. We also discuss general coding practices that are not specific to React but are crucial for writing quality code.

Remember, this document is meant to serve as a guide, not a strict rulebook. While it's important to strive for consistency, it's equally important to use common sense and personal judgment. If a specific guideline doesn't make sense in a particular context, or if there's a better way of doing something, don't hesitate to deviate from the guide. In such cases, ensure to discuss your approach with the team to keep everyone in the loop.

Feel free to add to this document or make modifications as necessary, ensuring it remains an up-to-date and useful resource for everyone.

### **Component Organization**

When creating a component, aim for reusability and maintainability. If a component becomes too complex, it might need to be broken down into smaller, more manageable components.

<aside>
💡 **General component structure**

</aside>

**Do:**

- Separate a large component into smaller ones if it performs several distinct tasks.

```tsx
// Good
function UserProfile() {
  return (
    <div>
      <ProfileHeader />
      <ProfileBody />
    </div>
  );
}
w;
```

**Don't:**

- Avoid writing a very long component that accomplishes multiple things.

```tsx
// Avoid
function UserProfile() {
  return (
    <div>
      {/* Lots of code for the profile header */}
      {/* Lots of code for the profile body */}
    </div>
  );
}
```

Our aim should be to create components that are cohesive and adhere to the Single Responsibility Principle (SRP). A component should ideally do one thing and do it well.

**Do:**

- Break down components that are doing too much.

```tsx
// Good
function UserProfile() {
  return (
    <div>
      <UserDetails />
      <UserPosts />
    </div>
  );
}
```

**Don't:**

- Avoid creating components that handle too many responsibilities.

```tsx
// Avoid
function UserProfile() {
  // User details logic
  // User posts logic
}
```

**Do**:

- Split UI and logic by using separate components (Presentational and Container Components)

```jsx
// Presentational component - focus on rendering the UI
function Form({ formData, onInputChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <input name="name" value={formData.name} onChange={onInputChange} />
      <input name="email" value={formData.email} onChange={onInputChange} />
      <button type="submit">Submit</button>
    </form>
  );
}

// Container component - handle state and data concerns
function FormContainer() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted:", formData);
  };

  return (
    <Form
      formData={formData}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
    />
  );
}
```

**Don't**:

- Combine UI and logic into a single, monolithic component.

```jsx
function Form() {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted:", formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={handleInputChange} />
      <input name="email" value={formData.email} onChange={handleInputChange} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Naming Conventions

In general, we follow the guidelines outlined: [Naming Cheatsheet](https://github.com/kettanaito/naming-cheatsheet).

<aside>
💡 **Explicit Naming Convention**

</aside>

Maintain readability and understandability of your code by using descriptive and meaningful names for your variables, functions, and components. This will make your code self-explanatory to others (and to yourself, when you return to it later).

**Do:**

- Use descriptive names that reflect the purpose or functionality of the variable, function, or component.

  ```tsx
  // Good
  function calculateDiscountedPrice(originalPrice, discountPercentage) {
    return originalPrice - originalPrice * (discountPercentage / 100);
  }

  const discountedPrice = calculateDiscountedPrice(itemPrice, discount);
  ```

**Don't:**

- Avoid generic or single-letter names that don't provide any context about their usage or purpose.

```tsx
// Avoid
function calc(p, d) {
  return p - p * (d / 100);
}

const p = calc(x, y);
```

---

<aside>
💡 Naming Functions: 'get' vs 'make', 'create', 'determine'

</aside>

It is common to see 'get' used in method names when information is being retrieved, such as from an object, a database or an API call.
However, the 'get' prefix can sometimes be misleading, especially when it is used in functions that perform different kinds of operations like computations or transformations. Function names should be descriptive and accurately portray what they do.

**Do:**

- Keep 'get' or 'fetch' prefix for functions that are used to fetch or retrieve data from an external source such as an API or database.

```tsx
// Good practice:
async function getLatestResultsFilterOptions() {
  const response = await axios.get("/api/latestResultsFilterOptions");
  return response.data;
}

// Good practice:
function createLatestResultsFilterOption(dateRanges) {
  return {
    key: latestResultsDateKey,
    label: i18next.t("header.dateFilter.placeholderLabel"),
    startDate: "",
    endDate: "",
    id: determineLatestCycleId(dateRanges),
  };
}
```

**Don't:**

- Avoid using the 'get' prefix for functions that do not fit the data retrieval paradigm. This can cause confusion and make the code harder to understand.

```tsx
// Avoid:
function getLatestResultsFilterOption(dateRanges) {
  return {
    key: latestResultsDateKey,
    label: i18next.t("header.dateFilter.placeholderLabel"),
    startDate: "",
    endDate: "",
    id: determineLatestCycleId(dateRanges),
  };
}

// Good practice:
function formatLatestResultsFilterOption(dateRanges) {
  return {
    key: latestResultsDateKey,
    label: i18next.t("header.dateFilter.placeholderLabel"),
    startDate: "",
    endDate: "",
    id: determineLatestCycleId(dateRanges),
  };
}
```

---

<aside>
💡 **Event Handlers**: 'onClick' vs 'handleClick'

</aside>

- When passing an event handler as a prop to a child component, the prop should be named using the prefix `on`, followed by the event or action (e.g., `onClick`, `onSubmit`).
- When defining an event handler within the component itself, the function should be named using the prefix `handle`, followed by the event or action (e.g., `handleClick`, `handleSubmit`).

This approach provides clear differentiation between event handlers passed as props and those defined within the component. It also helps improve readability and maintain consistency across the codebase.

**Do:**

```jsx
// Parent Component
function ParentComponent() {
  const handleClick = () => {
    console.log("Button clicked!");
  };

  return <ChildComponent onClick={handleClick} />;
}

// Child Component
function ChildComponent({ onClick }) {
  return <button onClick={onClick}>Click Me</button>;
}
```

**Don’t:**

```jsx
// Parent Component
function ParentComponent() {
  const onClickButton = () => {
    console.log("Button clicked!");
  };

  return <ChildComponent handleClick={onClickButton} />;
}

// Child Component
function ChildComponent({ handleClick }) {
  return <button onClick={handleClick}>Click Me</button>;
}
```

---

<aside>
💡 **Constants, Enums, and Interfaces Naming Convention**

</aside>

When naming constants, enums, and interfaces, follow these conventions to maintain consistency and improve code readability:

**Constants:**

- Use UPPER_SNAKE_CASE for constant names.
- Choose descriptive names that clearly indicate the constant's purpose.
  **Do:**
  ```jsx
  const MAX_RETRY_ATTEMPTS = 3;
  const DEFAULT_TIMEOUT_MS = 5000;
  const API_BASE_URL = "https://api.example.com";
  ```
  **Don’t:**
  ```jsx
  const max = 3;
  const timeout = 5000;
  const url = "https://api.example.com";
  ```

**Enums:**

- Use PascalCase for enum names.
- Use singular nouns for enum names unless they represent a group.
- Use UPPER_CASE for enum key.
- Use kebab case for the enum value.
- Avoid adding Enum to the name

**Do:**

```jsx
enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

enum UserRole {
  SUPER_ADMIN = 'super-admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}
```

**Don’t:**

```jsx
enum httpCodes {
  ok = 200,
  badRequest = 400,
  // ...
}

enum USERROLES {
  admin = 'admin',
  editor = 'editor',
  // ...
}
```

**Interfaces:**

- Use PascalCase for interface names.
- Don't use the "I" prefix for interface names (e.g., avoid IUser).
- Use descriptive names that represent the structure or contract the interface defines.
  **Do:**

  ```jsx
  interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  }

  interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
  }

  interface ApiResponse<T> {
    data: T;
    status: HttpStatusCode;
    message: string;
  }
  ```

  **Don’t:**

  ```jsx
  interface IUser {
    // ...
  }

  interface ProductInterface {
    // ...
  }

  interface api_response<T> {
    // ...
  }
  ```

### State Management and context usage

<aside>
💡 **We use `useContext` for state management**

</aside>

**Do:**

- Use **`useContext`** when the same state is required in at least three different components ([following the WET rule - Write Everything Twice](https://kentcdodds.com/blog/aha-programming)). This promotes code reuse and minimizes prop drilling.
- Split the context into a Provider and a custom hook for better organization and usage.
- Create separate, focused contexts for different parts of your application state.

**Don't:**

- Don't use **`useContext`** for state that's local to a component. If state is only being used in a single component or just two.
- Don't create one large context and spread it all over the app. This can lead to unnecessary re-renders and make your application harder to maintain.

This approach encourages thoughtful use of context and helps prevent unnecessary application-wide state sharing, which could lead to harder-to-maintain code and potential performance issues. By creating multiple, focused contexts, you can ensure that components only re-render when the specific state they depend on changes.

<aside>
💡  **Context Implementation Best Practices**

</aside>

1.  **Split into Provider and Custom Hook:**
    Create a separate Provider component and a custom hook for each context. This separation improves code organization and reusability.

        Example Provider:

        ```tsx
        export const AspectsContext = createContext<AspectsContextProps | undefined>(undefined);

        export const AspectsProvider = ({ children }: { children: React.ReactNode }) => {
          const [state, dispatch] = useReducer(aspectsReducer, initialState);

          const fetchAspects = async (params?: AspectsParams) => {
            // Implementation details...
          };

          const value: AspectsContextProps = { ...state, dispatch, fetchAspects };

          return <AspectsContext.Provider value={value}>{children}</AspectsContext.Provider>;
        };
        ```

        Example Custom Hook:

        ```tsx
        export const useAspects = () => {
          const context = useContext(AspectsContext);

          if (!context) {
            throw new Error('useAspects must be used within an AspectsProvider');
          }

          return context;
        };
        ```

1.  **Error Handling in Custom Hook:**

Include error handling in the custom hook to ensure the context is used correctly within a provider. This helps catch errors early in development.

1. **Testing Considerations:**

When testing components that use context, try to design them in a way that doesn't require wrapping with a context provider. If this isn't possible, create a test wrapper that provides the necessary context.

### Performance Considerations

<aside>
💡 **useMemo & useCallback**

</aside>

Avoid premature optimization. Specifically, don't use `useMemo` or `useCallback` unless profiling proves it necessary.

**Do:**

- Only use `useMemo` and `useCallback` when necessary.

```tsx
// Good
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

**Don't:**

- Don't use `useMemo` or `useCallback` without a proven performance need.

```tsx
// Avoid
const memoizedValue = useMemo(() => computeValue(a, b), [a, b]); // where computeValue is not an expensive operation
```

Remember, these hooks come with their own overhead, so only use them when necessary.

**Rule of thumb**, only use **`useMemo`** when:

1. The computation is noticeably slowing down your renders.
2. The same computation is likely to be done across multiple renders with the same inputs.
3. You have profiled your app with the React DevTools Profiler or another benchmarking tool and have determined that optimizing this specific computation improves performance.
4. [More performance key points](https://github.com/coryhouse/reactjsconsulting/issues/77)

---

<aside>
💡 **Keys in Lists**

</aside>

React uses the ﻿key prop in lists to identify which items have changed, are added, or are removed. Keys should be stable, predictable, and unique for components in a collection. Using functions that generate a new key on every render, like ﻿uuid(), is not advisable.

**Do:**

- Use identifiers that are unique and stable across re-renders for your keys.

```tsx
// Good
const userList = users.map((user) => <tr key={user.id}>{user.name}</tr>);
```

**Don't:**

- Avoid using ﻿`uuid()` or similar functions that generate a unique ID each time they're called as keys. This makes React believe that every element is always new, leading to unnecessary re-renders and negatively affecting performance.

```tsx
// Avoid
<tr key={uuid()}>{user.name}</tr>
```

Using random values obtained from calls to ﻿`uuid()` as keys disrupts React's diffing algorithm leading to unnecessary unmounting/mounting of components which negatively impacts performance and may cause issues with component state.

### File Structure

Maintaining a consistent file structure makes it easier to locate specific files and understand how different parts of the project are related.

<aside>
💡 **Mock Files**

</aside>

- All mock files should be named `.mock.ts` and placed in the `mocks` directory.

```
.
└── src
    └── mocks
        └── myMock.mock.ts
```

---

<aside>
💡 **Screens and Components**

</aside>

- For each screen, create a directory under the `screens` directory.
- If a component is used only within a particular screen, place it in a `components` directory within that screen's directory.
- If a component is used in multiple screens, place it in the main `src/components` directory.

```
.
└── src
    ├── components
    │   └── SharedComponent.tsx
    └── screens
        └── HomeScreen
            ├── HomeScreen.tsx
            └── components
                └── HomeScreenSpecificComponent.tsx
```

---

<aside>
💡 **Services**

</aside>

- API calls should be placed in the `services` directory.

```
.
└── src
    └── services
        └── api.ts
```

---

<aside>
💡 **Component Folders**

</aside>

- Each component should have its own folder, which includes the component file, test file, and any necessary helper files.

```
.
└── src
    └── components
        └── ParentComponent
            ├── ParentComponent.tsx
            ├── ParentComponent.spec.tsx
            ├── SubComponent1
            │   ├── SubComponent1.tsx
            │   ├── SubComponent1.spec.tsx
            │   ├── helpers.ts (if necessary)
            │   └── helpers.spec.ts (if necessary)
            └── SubComponent2
                ├── SubComponent2.tsx
                ├── SubComponent2.spec.tsx
                ├── helpers.ts (if necessary)
                └── helpers.spec.ts (if necessary)
```

---

<aside>
💡 **Contexts**

</aside>

- All context providers should be placed in the `contexts` directory.

```
.
└── src
    └── contexts
        └── MyContext.tsx
```

---

<aside>
💡 **Hooks**

</aside>

- Custom hooks should be placed in the `hooks` directory.

```
.
└── src
    └── hooks
        └── useMyHook.ts
```

---

<aside>
💡

**Multi-Domain Structure**

</aside>

As your project evolves, regularly review and refactor the location of hooks and contexts. Move them to more shared locations as their usage expands across features or domains. This approach maintains a clean structure while allowing for flexibility as your project grows.

**Don't:**

- Avoid mixing shared and feature-specific code within the same directory.
- Don't place feature-specific hooks or contexts in shared directories prematurely.
  **Do:**
- Keep feature-specific hooks and contexts within their feature directories.
- Put domain-specific shared hooks and contexts in `[domain]/common`.
- Place globally shared hooks and contexts in `src/common`.

Example structure:

- Feature-specific code should remain within its feature directory in the respective domain.
- Within each domain and the common directory, maintain `hooks` and `contexts` subdirectories.
- Each domain (backoffice, dashboard) has its own directory at the root level.
- Place shared code used across all domains in a `common` directory at the root level.

In projects with multiple domains (e.g., backoffice and dashboard), organize shared and domain-specific code as follows:

```
.
└── src
├── common
│   ├── hooks
│   │   └── useSharedHook.ts
│   └── contexts
│       └── SharedContext.tsx
├── backoffice
│   ├── hooks
│   │   └── useBackofficeHook.ts
│   ├── contexts
│   │   └── BackofficeContext.tsx
│   └── features
│       └── SurveysList
│           ├── hooks
│           │   └── useSurveysList.ts
│           ├── contexts
│           │   └── SurveysListContext.tsx
│           └── components
│               └── SurveyItem.tsx
└── dashboard
```

### Styling

<aside>
💡 **Use Logical CSS**

</aside>

We use SCSS for styling our components and leverage [logical CSS properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) for better RTL (Right-To-Left) support. Our color definitions are fetched from the shared Common UI.

**Do:**

- Import common ui styling

```css
@use "@zencity/common-ui/styles/zcd-colors";
@use "@zencity/common-ui/styles/zcd-typography";
```

```css
// Good
.myComponent {
  background: zcd-colors.$zcd-blue-20;
  padding-inline-start: 1rem;
}
```

**Don't:**

- Avoid using color codes directly in the component styles and avoid using directional CSS properties.

```css
// Avoid
.myComponent {
  background: #3c87cd;
  padding-left: 1rem;
}
```

---

<aside>
💡 **Avoid Magic Numbers**

</aside>

- Avoid using specific pixel values that only work in specific circumstances.

**Do:**

```tsx
// Good
.myComponent {
  padding: 1rem;
  margin: 1rem 0;
}

// Good
.myComponent {
  width: calc(100% - $header-height);
}

// Good
const QUESTIONS_OFFSET = 2;
const questions = sampleSize(questionsArray, QUESTIONS_OFFSET);
```

**Don't:**

```tsx
// Avoid
.myComponent {
  padding: 17px;
  margin: 23px 0;
}

// Aviod
const questions = sampleSize(questionsArray, 2);
```

---

<aside>
💡 **Use Variables for Frequently Used Values**

</aside>

- Define and use SCSS variables for values that are used in multiple places.

**Do:**

```css
// Good
$default-padding: 1rem;

.myComponent {
  padding: $default-padding;
}

.myComponent2 {
  padding: $default-padding;
}
```

**Don't:**

```css
// Avoid
.myComponent {
  padding: 1rem;
}

.myComponent2 {
  padding: 1rem;
}
```

<aside>
💡 **Avoid Over-Specificity in Global CSS**

</aside>

- Over-specificity in CSS, especially within the global scope, can lead to style conflicts and unpredictable outcomes due to the cascading nature of CSS. It's important to avoid deeply nested or overly specific selectors that control the styling of HTML elements directly, as this can complicate maintenance and override styles in unexpected ways throughout the application.

**Do:**

```css
// Good
/* Using generic class selectors with locally scoped styles */
.button {
  padding: 10px 20px;
  margin: 20px;
}

.icon {
  display: inline-block;
  margin: 5px;
}
```

**Don't:**

```css
// Avoid
.notificationContainer span {
  margin: 20px 0;
}

.notificationContainer button {
  margin: 70px 40px 10px;
}

.notificationContainer i {
  margin: auto;
}
```

---

<aside>
💡 **Use CSS Variables for Consistent Spacing and Sizing**

</aside>

Using CSS variables (custom properties) and calculations helps maintain consistency across your styles and avoids the use of magic numbers. This approach provides a single source of truth for common values and makes it easier to update styles globally.

**Do:**

- Define CSS variables for common spacing, sizes, and other repeated values.
- Use `calc()` function with CSS variables for flexible and maintainable layouts.
- Store these variables in a central location (e.g., a `variables.scss` file) and import them where needed.

```scss
// Example variables.scss:
:root {
  --spacing-unit: 8px;
  --header-height: 60px;
  --sidebar-width: 250px;
  --content-max-width: 1200px;
}

// Usage:
@import "path/to/variables";

.mainContent {
  max-width: var(--content-max-width);
  margin-top: calc(var(--header-height) + var(--spacing-unit));
  padding: calc(var(--spacing-unit) * 2);
}

.sidebar {
  width: var(--sidebar-width);
  height: calc(100vh - var(--header-height));
}

.gridItem {
  flex-basis: calc((100% - (var(--spacing-unit) * 3)) / 4);
  margin-right: var(--spacing-unit);
  margin-bottom: var(--spacing-unit);

  &:nth-child(4n) {
    margin-right: 0;
  }
}
```

**Don’t:**

- Avoid using magic numbers directly in your styles.
- Don't repeat the same numeric values across multiple files.

```scss
// Avoid
.mainContent {
  max-width: 1200px;
  margin-top: 68px; // magic number (60px header + 8px spacing)
  padding: 16px; // magic number
}

.sidebar {
  width: 250px;
  height: calc(100vh - 60px); // magic number
}
```

By using CSS variables and calculations, we create more flexible and maintainable styles. This approach allows for easy adjustments to global styling by changing the values in one central location.

<aside>
💡

**Things to avoid:**

</aside>

- Unnecessary CSS animations or transitions that impact performance.
- Using `*` or universal selectors.
- Inline styles, unless absolutely necessary.

### General guidelines

<aside>
💡 **Code Reusability: WET vs DRY vs AHA**

</aside>

### Key Concepts:

- **DRY (Don't Repeat Yourself)**: Traditional principle focusing on avoiding code duplication
- **WET (Write Everything Twice)**: Allow some controlled repetition
- **AHA (Avoid Hasty Abstractions)**: Prefer duplication over the wrong abstraction

### When to Apply Each Principle

**DRY - Don't Repeat Yourself**

- Use when the duplicated code represents the exact same business logic
- When changes to one instance would always require the same changes to other instances
- When the abstraction is clear and unlikely to change

```tsx
// Good DRY example
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

// Used across multiple components
const price1 = formatCurrency(99.99, "USD");
const price2 = formatCurrency(89.99, "USD");
```

**WET - Write Everything Twice**

- When you first encounter similar code patterns
- When you're not completely sure if the patterns will evolve differently
- When the cost of wrong abstraction would be higher than duplication

```tsx
// Acceptable WET example
const UserProfile = () => {
  const handleNameUpdate = (name: string) => {
    // Specific validation and update logic for names
    updateUserName(name);
  };

  const handleEmailUpdate = (email: string) => {
    // Specific validation and update logic for emails
    validateEmail(email);
    updateUserEmail(email);
  };

  return (
    // Component JSX
  );
};

```

**AHA - Avoid Hasty Abstractions**

- When you notice patterns starting to diverge
- When abstractions require many parameters to handle different cases
- When the abstraction makes the code harder to understand

```tsx
// 🚫 Overly abstracted button component
const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  isFullWidth,
  isLoading,
  // ... more props
}) => {
  // Complex conditional logic to handle all cases
  return (
    <button
      className={`
        btn 
        ${variant} 
        ${size} 
        ${isFullWidth ? "w-full" : ""} 
        ${isLoading ? "loading" : ""}
        // More className conditions...
      `}
    >
      {/* Complex rendering logic */}
    </button>
  );
};

// ✅ Better: Specific button components for specific use cases
const PrimaryButton = ({ children, onClick }: ButtonBaseProps) => (
  <button
    className="bg-blue-500 text-white px-4 py-2 rounded"
    onClick={onClick}
  >
    {children}
  </button>
);

const LoadingButton = ({ children, isLoading }: LoadingButtonProps) => (
  <button
    className="bg-blue-500 text-white px-4 py-2 rounded"
    disabled={isLoading}
  >
    {isLoading ? <Spinner /> : children}
  </button>
);

const IconButton = ({ icon, label }: IconButtonProps) => (
  <button className="p-2 rounded-full bg-gray-100" aria-label={label}>
    {icon}
  </button>
);
```

### Best Practices

1. **Start with WET**
   - Write similar code twice or three before considering abstraction
   - Observe how the code evolves in different contexts
2. **Move to DRY When**
   - You have clear evidence that the code patterns are stable
   - The abstraction simplifies rather than complicates
   - Changes will always affect all instances similarly
3. **Apply AHA When**
   - Abstractions become too complex
   - You find yourself fighting against the abstraction
   - Different use cases require significantly different behavior

<aside>
💡 ⚠️ Remember: The cost of a wrong abstraction is higher than the cost of code duplication.

</aside>

### Decision Framework

Ask these questions before abstracting:

1. Will this abstraction simplify the codebase?
2. Is the pattern stable and unlikely to diverge?
3. Would a new team member understand this abstraction easily?
4. Can you maintain this abstraction without constant modifications?

If you answer "no" to any of these questions, consider keeping the code WET or breaking down existing abstractions.

---

<aside>
💡 **Misuse useEffect**

</aside>

**Do:**
Perform manipulation directly on props and store the result in a variable if the manipulated value does not affect render.

```tsx
function MyComponent({ propValue }) {
  const manipulatedValue = manipulate(propValue);

  return <div>{manipulatedValue}</div>;
}
```

**Avoid:**
Avoid copying props into local state and synchronizing in `useEffect` if not necessary, as it may lead to extra unnecessary renders.

```tsx
function MyComponent({ propValue }) {
  const [manipulatedValue, setManipulatedValue] = useState();

  useEffect(() => {
    setManipulatedValue(manipulate(propValue));
  }, [propValue]);

  return <div>{manipulatedValue}</div>;
}
```

The avoid example above shows a scenario where the `propValue` prop is manipulated and then stored in a local state using `useEffect`. This pattern might be necessary in some cases, but it's often an indication that you're duplicating the "source of truth". This can lead to bugs because it increases the chances of the state and prop going out of sync. The component re-renders more often than necessary, which can lead to performance issues.

In the "do" example, the `propValue` prop is directly manipulated and used in the component. The component only re-renders when `propValue` itself changes, and there's no duplication of state.

---

<aside>
💡 **Avoid returning an empty fragment when no rendering is needed**

</aside>

**Do:**
Explicitly return **`null`** when no rendering is needed, signaling to React that you don't want to render anything. This approach is optimal because React won't attempt to render or update any part of the component subtree when **`null`** is returned.

```tsx
function MyComponent({ options }) {
  return options.length > 0 ? <OptionsList options={options} /> : null;
}
```

**Avoid:**
Avoid returning an empty fragment (**`<></>`**) when no content needs to be rendered. Even though it results in no visible content, an empty React Fragment still creates an object and requires processing time, albeit minimal.

```tsx
function MyComponent({ options }) {
  return options.length > 0 ? <OptionsList options={options} /> : <></>;
}
```

This example shows how to properly avoid rendering when it's not necessary in your component. It demonstrates that returning **`null`** is the preferred method as it avoids unnecessary processing and clearly communicates the intent not to render anything.

---

<aside>
💡 Avoid multiple conditions in a single statement

</aside>

**Do:**
Extract complex conditions into well-named variables. This makes your code cleaner and easier to understand.

**Avoid:**
Avoid using multiple conditions in a single if statement directly. It can make the code hard to read and understand, especially when dealing with optional chaining and indexing objects.

```tsx
function MyComponent({ selectedSurveyGroup, cyclesDataBySurveyGroup }) {
  const selectedGroupId = selectedSurveyGroup?.id;
  const hasCyclesData =
    selectedGroupId &&
    cyclesDataBySurveyGroup &&
    cyclesDataBySurveyGroup[selectedGroupId];

  if (!hasCyclesData) {
    return;
  }

  // ...
}
```

```tsx
function MyComponent({ selectedSurveyGroup, cyclesDataBySurveyGroup }) {
  if (
    !selectedSurveyGroup?.id ||
    !cyclesDataBySurveyGroup ||
    !cyclesDataBySurveyGroup[selectedSurveyGroup.id]
  ) {
    return;
  }

  // ...
}
```

In the "Do" example, we clearly define what the conditions mean by extracting them into the **`hasCyclesData`** variable. This makes the code much more readable, as other developers can quickly understand what the if statement is checking without needing to decipher the conditions themselves.

---

<aside>
💡 **useState vs useReducer**

</aside>

State and reducers in React are used to manage component state. `useState` is a simpler hook that's ideal for managing single values or objects with a small number of properties. `useReducer`, on the other hand, is more suited to complex state objects that contain multiple properties, or when the next state depends on the previous one.

Choosing between `useState` and `useReducer` can often come down to personal or team preference, and either can be used effectively in most situations. However, here are some general guidelines that you might find helpful:

### `useState`

**Do:**
Use `useState` when dealing with simple state updates.

```tsx
const [count, setCount] = useState(0);

const increment = () => {
  setCount(count + 1);
};
```

**Avoid:**
Avoid using `useState` when dealing with complex state objects or when the next state depends on the previous one.

```tsx
// Avoid: This can lead to state inconsistencies.
const [user, setUser] = useState({ name: "", age: "" });

const updateNameAndAge = (newName, newAge) => {
  setUser({ ...user, name: newName });
  setUser({ ...user, age: newAge });
};
```

### `useReducer`

**Do:**
Use `useReducer` when dealing with complex state logic, or when the next state depends on the previous one. It also gives you a predictable state container, as all updates go through one function, making it easier to test and debug.

```tsx
const initialState = { name: "", age: "" };

const reducer = (state, action) => {
  switch (action.type) {
    case "updateName":
      return { ...state, name: action.payload };
    case "updateAge":
      return { ...state, age: action.payload };
    default:
      throw new Error();
  }
};

const [state, dispatch] = useReducer(reducer, initialState);

const updateNameAndAge = (newName, newAge) => {
  dispatch({ type: "updateName", payload: newName });
  dispatch({ type: "updateAge", payload: newAge });
};
```

**Avoid:**
Avoid using `useReducer` for simple state updates where `useState` would suffice, as it may lead to unnecessarily complex code.

```tsx
// Avoid: This is an overly complex way to increment a count.
const initialState = { count: 0 };

const reducer = (state, action) => {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + 1 };
    default:
      throw new Error();
  }
};

const [state, dispatch] = useReducer(reducer, initialState);

const increment = () => {
  dispatch({ type: "increment" });
};
```

In the above "avoid" example, a simple count increment doesn't benefit from the complexity of `useReducer`. Using `useState` for such a case would lead to simpler and more readable code.

---

<aside>
💡 **Avoid Unnecessary Comments in Self-explanatory Code**

</aside>

**Do:**
Write clean, self-explanatory code that reduces the need for comments. Use clear and descriptive variable names, function names, and structure your code in a way that's easy to read and understand. It's okay to use comments to describe complex logic, but it's always better to strive for code that speaks for itself.

```tsx
// Good

function calculateDiscountPrice(price, discountPercentage) {
  const discountAmount = price * (discountPercentage / 100);
  return price - discountAmount;
}
```

**Avoid:**
Avoid using comments to explain what your code is doing if it's already self-explanatory. It's often better to let the code speak for itself. **In many cases, developers can update the code but forget to update the associated comments, which can lead to comments that are out of sync with the code and potentially confusing or misleading.**

```tsx
// Avoid

// This function calculates the discount price.
function calculateDiscount(price, discount) {
  // Calculate the amount of the discount.
  const discountAmount = price * (discount / 100);
  // Subtract the discount from the original price.
  return price - discountAmount;
}
```

---

<aside>
💡 **Avoid Optional Fields for Discrimination**

</aside>

Optional fields in TypeScript can inadvertently reduce type safety, especially when used to distinguish between different types.

**Don't:**

- Avoid using optional fields to differentiate between types, as this reduces TypeScript's ability to enforce the correct use of properties.

```tsx
// An optional field can't specify when a given field is required.
type Shape = {
  // Optional since a rectangle doesn't have a radius
  radius?: number;
  // Optional since a circle doesn't have these
  width?: number;
  height?: number;
```

**Do:**

- Instead, consider using a discriminated union. This makes the differences between types explicit, so TypeScript can enforce it.

```tsx
// The "kind' field *discriminates* between a circle and a rectangle.
type Circle = { kind: "circle"; radius: number };
type Rectangle = { kind: "rectangle"; width: number; height: number };

// Shape can be either a Circle or a Rectangle
type Shape = Circle | Rectangle;
```

With the above solution, TypeScript can enforce that the correct properties are used depending on the "kind" of the shape. This allows us to maintain type safety and make our code more predictable and easier to understand.

---

<aside>
💡 **Convention for Enum Names: Singular vs Plural**

</aside>

When defining enums in a codebase, it's essential to establish a naming convention for clarity and consistency. The choice between singular and plural names for enums can depend on what the enum is representing. Below are some guidelines to help you decide when to use singular names and when to use plural names.

### Use Singular Names for Enums When:

- The enum represents a single type or category.
- The enum is used as a discriminator or type identifier.
- You're using the enum to represent a single choice from mutually exclusive options.

### Example:

```tsx
// Good: Single type/category
enum LogLevel {
  Debug,
  Info,
  Warning,
  Error,
}

// Good: Type discriminator
enum EntityType {
  User,
  Post,
  Comment,
}

// Usage: Represents a single selection
const currentLogLevel: LogLevel = LogLevel.Info;
const entityType: EntityType = EntityType.User;
```

### Use Plural Names for Enums When:

- The enum represents a collection or group of items that might be used together.
- The enum values are commonly used in arrays or sets.
- You frequently need to iterate through or check multiple values.

### Example:

```tsx
// Good: Collection of permissions that can be combined
enum Permissions {
  Read = 1,
  Write = 2,
  Execute = 4,
  Admin = 8,
}

// Good: Collection of settings that might be used together
enum ValidationRules {
  Required = "required",
  Email = "email",
  MinLength = "minLength",
  MaxLength = "maxLength",
}

// Usage: Often used as a collection
const userPermissions = [Permissions.Read, Permissions.Write];
const formValidation = [ValidationRules.Required, ValidationRules.Email];

// Usage: Checking multiple values
const hasWriteAccess = (permissions: number) => {
  return (permissions & Permissions.Write) === Permissions.Write;
};
```

---

<aside>
💡 **Prefer Using Common UI**

</aside>

Always prefer to use components from our design system over creating new ones or using native HTML elements directly. This will ensure consistent behavior and styling across our repos.

**Do:**

- Use components from our design system whenever possible.

```tsx
// Good
import { ZCDInput } from '@zencity/common-ui';

function MyFormComponent() {
  return <ZCDInput placeholder="Type here..." />;
```

**Don't:**

- Avoid using native HTML elements when a corresponding component exists in our design system.

```tsx
// Avoid
function MyFormComponent() {
  return <input placeholder="Type here..." />;
}
```

Similarly, prefer using colors from our design system to maintain visual consistency across our application.

**Do:**

- Use colors from our design system whenever styling components.

```css
// Good
@use "@zencity/common-u/zcd-colors";

.myComponent {
  background: zcd-colors.$zcd-blue-20;
}
```

**Don't:**

- Avoid using explicit color codes, as this can lead to inconsistencies in our design.

```css
// Avoid
.myComponent {
  background: #3c87cd;
}
```

---

<aside>
💡 **Avoid Declaring Constants Inside Component**

</aside>

**Do:**

- Declare constants outside the component function.

```tsx
const translationPath = 'forms.inputFields';

export const CustomInput: React.FC<Props> = function CustomInput({ redirectUrl }: Props): ReactElement {
  ...
};
```

**Don't:**

- Don't declare constants inside the component function.

```tsx
// Avoid
export const CustomInput: React.FC<Props> = function CustomInput({ redirectUrl }: Props): ReactElement {
  const translationPath = 'forms.inputFields';
  ...
};
```

---

<aside>
💡 Avoid Declaring Constants Inside Component

</aside>

**Do:**

- Store strings in variables or constants.

```tsx
// Good
const BUTTON_VARIANTS = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
};

function MyButton({ variant }) {
  if (variant === BUTTON_VARIANTS.PRIMARY) {
    // primary button styling
  } else if (variant === BUTTON_VARIANTS.SECONDARY) {
    // secondary button styling
  }
}
```

**Don't:**

- Avoid using inline strings.

```tsx
// Avoid
function MyButton({ variant }) {
  if (variant === "primary") {
    // primary button styling
  } else if (variant === "secondary") {
    // secondary button styling
  }
}
```

---

<aside>
💡 Avoid Storing React Components in Variables

</aside>

By storing a React component inside a variable within another component, you cause this component to be re-created on every render of the parent component. This can lead to performance issues, especially if the child component is complex or has many children on its own.
Remember, components define reusable pieces of UI and should live as standalone functions or classes, not as variables. It's much cleaner, easier to test, and it also benefits from JSX's syntax highlighting and error checking

**Do:**

- Use JSX directly inside your parent component's return statement.

```tsx
// Good
function MyComponent() {
  const userName = "John";

  return <div>Hello, {userName}</div>;
}
```

**Don't:**

- Avoid storing JSX in variables inside your component.

```tsx
// Avoid
function MyComponent() {
  const userName = "John";
  const greeting = <div>Hello, {userName}</div>;

  return greeting;
}
```

---

<aside>
💡 Avoid Passing setState as Props/Argument

</aside>

By adhering to these guidelines, we avoid unnecessary coupling of components, making them more modular, easier to understand, and reusable. It also maintains control and understanding in the parent component of when and how their state is being altered, leading to more predictable code.

**Do:**

- Pass only necessary state values and create specific handler functions in the parent component. Use these handler functions to update state.

```tsx
// Good
const Parent = () => {
  const [user, setUser] = React.useState<UserInfo | undefined>(undefined);

  const handleUserChange: (newUser?: UserInfo) => void = (newUser) => {
    setUser(newUser);
  };

  return <Child onUserChange={handleUserChange} />;
};

type ChildProps = {
  onUserChange?: (newUser?: UserInfo) => void;
};

const Child: React.FC<ChildProps> = ({ onUserChange }) => {
  // Some code here...

  return <button onClick={() => onUserChange(modifiedUser)}>Press me</button>;
};
```

**Don't:**

- Avoid passing ﻿setState functions directly as props. Doing so creates tight coupling between your child component and the parent, reducing the reusability, readability, and flexibility of the child component.Avoid passing ﻿setState functions directly as props as this will tightly couple your child component to the parent, which reduces the flexibility, readability and reusability of your components

```tsx
// Avoid
const Parent = () => {
  const [user, setUser] = React.useState<UserInfo | undefined>(undefined);

  return <Child setUser={setUser} />;
};

type ChildProps = {
  setUser: React.Dispatch<React.SetStateAction<UserInfo | undefined>>;
};

const Child: React.FC<ChildProps> = ({ setUser }) => {
  // Some code here...

  return <button onClick={() => setUser(modifiedUser)}>Press me</button>;
};
```

---

<aside>
💡 Avoid Storing React Components in Variables

</aside>

By storing a React component inside a variable within another component, you cause this component to be re-created on every render of the parent component. This can lead to performance issues, especially if the child component is complex or has many children on its own.
Remember, components define reusable pieces of UI and should live as standalone functions or classes, not as variables. It's much cleaner, easier to test, and it also benefits from JSX's syntax highlighting and error checking

**Do:**

- Use JSX directly inside your parent component's return statement.

```tsx
// Good
function MyComponent() {
  const userName = "John";

  return <div>Hello, {userName}</div>;
}
```

**Don't:**

- Avoid storing JSX in variables inside your component.

```tsx
// Avoid
function MyComponent() {
  const userName = "John";
  const greeting = <div>Hello, {userName}</div>;

  return greeting;
}
```

<aside>
💡 Prefer Early Return

</aside>

The practice of "returning early" is a strategy where you exit or return a function as soon as you find out that it cannot do any more meaningful work. This can reduce the complexity of your code by reducing the need for deep nesting of if-else structures and improving readability.

**Do:**

```tsx
// Good
function checkUser(user) {
  if (!user) {
    return "No user provided";
  }

  if (!user.isActive) {
    return "User is not active";
  }

  return `Welcome, ${user.name}`;
}
```

**Don't:**

```tsx
// Avoid
function checkUser(user) {
  let message;
  if (user) {
    if (user.isActive) {
      message = `Welcome, ${user.name}`;
    } else {
      message = "User is not active";
    }
  } else {
    message = "No user provided";
  }
  return message;
}
```

### Common UI

---

<aside>
💡 **Follow these guidelines for each Common UI MR**

</aside>

- MR description should be detailed and explained to give context to other developers not in the loop, [Example MR](https://gitlab.com/zencity/platform/common-ui/-/merge_requests/276).
- Video/screenshots of the developed features should be included in the MR.
- Ensure all Component Props are Represented in the Storybook.
- [Create a deployment branch on each MR](https://gitlab.com/zencity/platform/common-ui#feature-branch-in-storybook).
- Follow this [Common ui ground rules](https://gitlab.com/zencity/platform/common-ui#ground-rules) and [Frontend Project Convention](https://www.notion.so/Zencity-Frontend-Conventions-e1768dd5bd324fc1bcdc560427972c30?pvs=21)

---

<aside>
💡 **Ground Rules**

</aside>

- ZCD components should live in `src/ZCD`
- ZCD components should start with the ZCD prefix, for example, `ZCDButton`
  this will help us to distinguish between local project components and ZCD components
- ZCD components should not accept `style` prop, and every variant should be controllable through props
- Every component should have a storybook stories file for easy visual testing
  All component should use `CSS modules` for their styles, CSS module file names should have the `.modules.scss` postfix
- Use CSS Logical Properties like `padding-inline-end` instead of `padding-right` or `inset-inline-start`, instead of `left`, this will help us build better bidirectional
- Export your component from `src/ZCD/index.ts` like so, to make them available to users: `export { ZCDDialog } from './ZCDDialog/ZCDDialog';`

<aside>
💡 **Class Names and Custom Styles in Components**

</aside>

When adding class names to your components, it is important to adhere to certain guidelines to maintain consistency and readability in your codebase.

Here are some things to consider:

- **Root Component Class Name:** The **`className`** prop should be used for the root component. This gives consumers of your component the flexibility to add their own styling if required.

```tsx
return (
  <div
    className={classNames(
      styles.card,
      className // <-- Add className prop to root component
    )}
  >
    {/* ...rest of the component */}
  </div>
);
```

- **Nested Components Custom Styles:** If there are nested components, add custom styles using a **`customStyles`** prop. This prop could be an object that maps each nested component to its respective class.

This follows the convention:

```tsx
customStyles?: {
    header?: string;
    body?: string;
    footer?: string;
};
```

The use of **`customStyles`** can then be seen in the component:

```tsx
return (
  <div className={classNames(styles.card, className)}>
    <div className={customStyles?.header}>{header}</div>
    <div className={customStyles?.body}>{children}</div>
    <div className={customStyles?.footer}>{footer}</div>
  </div>
);
```

### **Spacing, Layout, and Responsive Design in mind 📱**

**Importance of Responsive Design**

These principles are important even if you don't target different devices. Your element's position and container size might change in the future, certain content in it might change, and text will be different (with a different size) between locales. Your component should know how to adapt to this.

### **Margin vs. Padding**

When implementing designs from Figma, it's essential to understand when to use margin and when to use padding:

- **Margin**: Use for spacing between elements
- **Padding**: Use for internal spacing within an element

**Do:**

```scss
.card {
  margin-bottom: 16px; /* Space between cards */
  padding: 16px; /* Internal spacing within the card */
}
```

**Don’t:**

```scss
.card {
  margin: 16px; /* Avoid using margin for internal spacing */
  padding-bottom: 16px; /* Avoid using padding for spacing between elements */
}
```

### **Handling Dynamic or Optional Elements**

When dealing with dynamic or optional elements, consider using these techniques:

1. **Flexbox or Grid for layout**: These CSS layout systems can automatically adjust spacing when elements are added or removed.
2. **:empty pseudo-class**: Hide or adjust spacing for empty elements.
3. **:not(:last-child) selector**: Apply spacing to all but the last element in a group.

Examples:

```scss
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.card {
  flex: 1 1 300px;
}

.optional-element:empty {
  display: none;
}

.list-item:not(:last-child) {
  margin-bottom: var(--space-sm);
}
```

## **Importance of Responsive Design**

When developing user interfaces, it's crucial to code with responsiveness in mind to ensure a consistent and user-friendly experience across all device sizes. This approach helps prevent common issues such as overflowing content, misaligned elements, and unreadable text.

### **Responsive Design and Container Widths**

When implementing responsive designs:

1. Implement a flexible grid system
2. Use CSS media queries for breakpoints

Examples:

```scss
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-md);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-sm);
  }
}
```

For handling various screen sizes without specific designs:

1. Implement a mobile-first approach
2. Use flexible layouts (Flexbox/Grid) that adapt to different screen sizes
3. Test and adjust layouts at common breakpoints and use CSS custom properties for breakpoints

Examples:

```scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-md);
}

.flex-container {
  display: flex;
  flex-wrap: wrap;
  margin: calc(
    var(--space-md) * -0.5
  ); // Negative margin to counteract item margins
}

.flex-item {
  flex: 1 1 250px; // Grow, shrink, and base width
  margin: calc(var(--space-md) * 0.5); // Half of the gap on all sides
  min-width: 250px; // Minimum width before wrapping
  max-width: 100%; // Ensure items don't exceed container width on small screens
}

@media (min-width: 768px) {
  .flex-item {
    flex-basis: calc(
      50% - var(--space-md)
    ); // Two items per row on medium screens
  }
}

@media (min-width: 1024px) {
  .flex-item {
    flex-basis: calc(
      33.333% - var(--space-md)
    ); // Three items per row on large screens
  }
}
```

Example of maintaining consistent spacing using ZCDSpacer:

```tsx
import React from "react";
import { ZCDSpacer, SpacerSize, SpacerOrientation } from "./ZCDSpacer";

const ResponsiveLayout: React.FC = () => {
  return (
    <div className="responsive-container">
      <header>
        <h1>Welcome to our site</h1>
        <ZCDSpacer size="medium" orientation="vertical" />
        <nav>{/* Navigation items */}</nav>
      </header>
      <ZCDSpacer size="large" orientation="vertical" />
      <main>
        <section>
          <h2>Featured Content</h2>
          <ZCDSpacer size="small" orientation="vertical" />
          <div className="featured-grid">{/* Featured items */}</div>
        </section>
        <ZCDSpacer size="medium" orientation="vertical" />
        <section>
          <h2>Latest Updates</h2>
          <ZCDSpacer size="small" orientation="vertical" />
          <ul className="updates-list">{/* List items */}</ul>
        </section>
      </main>
      <ZCDSpacer size="large" orientation="vertical" />
      <footer>{/* Footer content */}</footer>
    </div>
  );
};
```

### Testing

---

<aside>
💡 **Go Beyond Basic Render Tests**

</aside>

Testing components goes beyond just ensuring that they render without error. Consider tests that assert component behavior, user interaction, and the component's response to changes in props or state. By doing so, we can ensure that our components function as expected in various scenarios, leading to a more robust and reliable application.

**Do:**

- Write tests that validate component behavior and user interaction.

```tsx
// Good
describe("<MyComponent />", () => {
  it("displays the correct text when the button is clicked", () => {
    const { getByText } = render(<MyComponent />);

    fireEvent.click(getByText("Click me"));

    expect(getByText("You clicked the button")).toBeVisible();
  });
});
```

**Don't:**

- Avoid writing only basic render tests.

```tsx
// Avoid
describe("<MyComponent />", () => {
  it("renders without error", () => {
    render(<MyComponent />);
  });
});
```

### Analytics

Analytics are a critical part of our product development lifecycle and require testing to prevent regressions.

<aside>
💡 Importance of Analytics

</aside>

Analytics provide crucial insights into how users interact with our features. They help us:

- Measure feature adoption and usage patterns
- Make data-driven product decisions
- Validate hypotheses about user behavior
- Identify pain points and opportunities for improvement

<aside>
💡 Implementing Analytics

</aside>

We use Amplitude for tracking user actions. When implementing new features, refer to the PRD for required analytics events, and **please use** [this Notion](https://www.notion.so/User-Analytics-0d9ffb7de8db417ab6e963d0ae688a31?pvs=21) for implementation.

<aside>
💡 Why Analytics Break During Refactoring

</aside>

Analytics implementations are often tightly coupled to component structure and lifecycle. When refactoring components, analytics can break in several ways:

1. **Event timing issues**: Analytics events may be triggered at incorrect times if component lifecycle methods change
2. **Missing events**: Events might be removed entirely during refactoring
3. **Incorrect data**: The data passed to analytics events might change or become incorrect
4. **Duplicate events**: Multiple events might be fired when only one is expected

<aside>
💡 Common Refactoring Scenarios That Break Analytics

</aside>

- Changing component hierarchy
- Moving logic between components
- Converting class components to functional components
- Implementing code splitting or lazy loading
- Changing state management approaches

<aside>
💡 Testing Analytics to Prevent Regression

</aside>

Always include tests for analytics when implementing or refactoring components.

### Do:

```tsx
// Component with analytics
const FeatureButton = () => {
  const handleClick = () => {
    // Feature logic
    // Analytics should be the last thing in the function to ensure analytics are recorded only when the operation succeeds.
    analytics.trackEvent("feature_button_clicked", { feature: "example" });
  };

  return <button onClick={handleClick}>Use Feature</button>;
};

// Test for analytics
describe("FeatureButton", () => {
  it("should track click event with correct parameters", () => {
    const analyticsSpy = jest.spyOn(analytics, "track");

    render(<FeatureButton />);
    fireEvent.click(screen.getByText("Use Feature"));

    expect(analyticsSpy).toHaveBeenCalledWith(
      "feature_button_clicked",
      expect.objectContaining({ feature: "example" })
    );
  });
});
```

### Don't:

```tsx
// Don't refactor without updating tests
// Original component with analytics
const FeatureButton = () => {
  const handleClick = () => {
    analytics.track("feature_button_clicked", { feature: "example" });
    // Feature logic
  };

  return <button onClick={handleClick}>Use Feature</button>;
};

// Refactored component with broken analytics
const FeatureButton = () => {
  return <button onClick={() => doFeatureLogic()}>Use Feature</button>;
};

// Analytics call was lost during refactoring!
const doFeatureLogic = () => {
  // Feature logic only, analytics call missing
};
```

---

<aside>
💡 Backend Analytics

</aside>

Tracking events on the backend is rare (mainly for email opens). There's currently no shared utility for backend user analytics. Contact the [Platform](https://www.notion.so/Connect-formerly-Platform-2f2d858ef7c94f9b89b808b948773dcb?pvs=21) team if needed.

### Packages

<aside>
💡 Organize package exports around logical domains rather than file structure to improve maintainability, tree-shaking, and developer experience.

</aside>

When creating packages for internal or external consumption, how you structure and export your code significantly impacts usability, maintainability, and performance. Domain-based exports organize functionality around logical domains or features rather than arbitrary file structures.

### Explicit Named Exports

**Do:**

```tsx
// In domain-specific files
// user/userActions.ts
export function fetchUser() {
  /* ... */
}
export function updateUser() {
  /* ... */
}

// user/userSelectors.ts
export function selectUserProfile() {
  /* ... */
}

// In index.ts
export { fetchUser, updateUser } from "./user/userActions";
export { selectUserProfile } from "./user/userSelectors";
```

**Don't:**

```tsx
// index.ts
export * from "./user/userActions";
export * from "./user/userSelectors";
```

Explicit named exports make it clear exactly what your package provides, improve tree-shaking, and prevent naming collisions. Wildcard exports (`export *`) make it difficult to track what's being exported and can lead to unintentional breaking changes.

### Domain-Oriented Subpath Exports

**Do:**

```json
// package.json
{
  "name": "@company/my-package",
  "exports": {
    ".": "./dist/index.js",
    "./user": "./dist/user/index.js",
    "./auth": "./dist/auth/index.js",
    "./utils": "./dist/utils/index.js"
  }
}
```

**Don't:**

```json
// package.json
{
  "name": "@company/my-package",
  "main": "./dist/index.js"
}

// Consumers must import from internal paths
// import { something } from '@company/my-package/dist/some/internal/path';
```

Subpath exports provide clear, stable entry points for different domains within your package. They allow consumers to import only what they need and protect them from your internal file structure.

### Type Exports

**Do:**

```tsx
// types.ts
export interface User {
  id: string;
  name: string;
}

// index.ts
export type { User } from "./types";
```

**Don't:**

```tsx
// Mixing type and value exports inconsistently
export { someFunction, SomeInterface } from "./module";
// Consumer can't tell which are types and which are values
```

Use `export type` for TypeScript types to make it clear what are type exports versus value exports. This improves readability and works better with tools that distinguish between types and values.

### Documentation Comments

**Do:**

````tsx
/**
 * Fetches user data from the API
 * @param userId - The ID of the user to fetch
 * @returns A promise that resolves to the user data
 * @example
 * ```ts
 * const user = await fetchUser('123');
 * ```
 */
export function fetchUser(userId: string): Promise<User> {
  // ...
}
````

**Don't:**

```tsx
// Fetches a user
export function fetchUser(id: string) {
  // ...
}
```

Add comprehensive JSDoc comments to all public exports. These will appear in IDE tooltips and can be extracted to generate documentation.
