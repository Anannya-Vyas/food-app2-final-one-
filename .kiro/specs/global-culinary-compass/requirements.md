# Requirements Document

## Introduction

Global Culinary Compass is a full-stack, AI-powered culinary discovery and community platform. It enables users to explore authentic recipes from every country and region on Earth, discover what to eat when visiting a destination, share family and grandmother recipes, learn cooking and gardening skills, and get real-time AI assistance when something goes wrong in the kitchen. The platform is web-first (Next.js frontend) with a backend API (Node.js/Express or Python/FastAPI), dual databases (PostgreSQL with pgvector for structured/AI data, MongoDB for social feeds), and a Razorpay-powered subscription model with a 30-day free trial.

---

## Glossary

- **App**: The Global Culinary Compass web application.
- **User**: Any registered account holder on the App.
- **Guest**: An unauthenticated visitor browsing the App.
- **Recipe**: A structured culinary document containing ingredients, steps, origin metadata, images, and optional audio.
- **Region**: A country, state, province, or culturally distinct geographic area associated with one or more Recipes.
- **Recipe_Fixer**: The AI module powered by the Gemini API that diagnoses and corrects cooking mistakes.
- **Dish_Scanner**: The computer-vision module (YOLOv8) that identifies food from uploaded images and estimates nutritional data.
- **Social_Feed**: The Instagram-style content stream where Users post food reviews, tag Recipes, and share videos.
- **Culinary_Academy**: The in-app learning section containing cooking and gardening lesson content.
- **Marketplace**: The local ingredient sourcing section connecting Users with regional suppliers.
- **Subscription_Service**: The Razorpay-backed billing system managing free trials and premium access.
- **Translation_Service**: The LibreTranslate instance providing multi-language content translation.
- **Audio_Guide**: AI-synthesized voice narration of Recipe instructions.
- **Paywall**: The glassmorphism UI overlay that restricts access to premium features.
- **Webhook_Handler**: The backend endpoint that receives and verifies Razorpay payment event callbacks.
- **Search_Engine**: The Meilisearch instance powering typo-tolerant, instant recipe discovery.
- **pgvector**: The PostgreSQL extension enabling semantic (vector) similarity search.
- **Content_Moderator**: The backend service responsible for reviewing user-generated content for policy violations.

---

## Requirements

### Requirement 1: User Authentication and Onboarding

**User Story:** As a new visitor, I want to create an account and personalize my experience, so that the App can surface relevant recipes and remember my preferences.

#### Acceptance Criteria

1. THE App SHALL provide email/password registration and OAuth sign-in via Google and Apple.
2. WHEN a User completes registration, THE App SHALL initiate a 30-day free trial and record `trial_start_date` in the database.
3. WHEN a User first signs in, THE App SHALL present an onboarding flow that collects dietary preferences, cuisine interests, and preferred language.
4. THE App SHALL store onboarding preferences and use them to personalize the home feed and recipe recommendations.
5. IF a User submits a registration form with an already-registered email address, THEN THE App SHALL return a descriptive error message without creating a duplicate account.
6. IF a User's session token expires, THEN THE App SHALL redirect the User to the sign-in screen and preserve the URL the User was attempting to access.

---

### Requirement 2: Global Recipe Database

**User Story:** As a food explorer, I want access to a comprehensive database of recipes from every country and region, so that I can discover authentic local dishes anywhere in the world.

#### Acceptance Criteria

1. THE App SHALL store Recipes with the following structured fields: title, origin Region, ingredients list, step-by-step instructions, preparation time, cooking time, serving size, dietary tags, and at least one cover image.
2. THE App SHALL associate each Recipe with a Region at both country and sub-national (state/province) level.
3. WHEN a User views a Recipe, THE App SHALL display the Recipe in the User's preferred language using the Translation_Service.
4. THE App SHALL also display the Recipe in the original language of the Region alongside the translated version.
5. WHEN a User views a Recipe, THE App SHALL display an Audio_Guide option that narrates the instructions using AI voice synthesis.
6. THE App SHALL support dietary classification tags including but not limited to: vegan, vegetarian, gluten-free, dairy-free, nut-free, diabetic-friendly, and halal.
7. THE App SHALL display a "Flavor Spectrum" indicator on each Recipe showing the dish's flavor profile (e.g., spicy, sweet, savory, earthy).

---

### Requirement 3: Hyper-Local Travel Discovery

**User Story:** As a traveler, I want to search for a destination and see what I should eat there, so that I can experience authentic local cuisine when I visit.

#### Acceptance Criteria

1. WHEN a User searches for a destination (country, state, or city), THE App SHALL return a curated list of must-try Recipes and famous local dishes associated with that Region.
2. THE App SHALL provide an interactive world map ("Tastes of the World Map") where Users can tap or click a Region to browse its Recipes.
3. WHEN a User grants location permission, THE App SHALL automatically suggest Recipes from the User's current geographic Region.
4. IF a User searches for a destination that has no Recipes in the database, THEN THE App SHALL display a "No recipes found yet" message and invite the User to contribute a Recipe for that Region.
5. THE App SHALL rank discovery results by a combination of community rating, recipe completeness score, and regional authenticity tags.

---

### Requirement 4: User-Generated Recipes

**User Story:** As a home cook, I want to share my family and grandmother recipes with the world, so that traditional and personal recipes are preserved and discovered by others.

#### Acceptance Criteria

1. WHEN a User submits a new Recipe, THE App SHALL require: title, at least one Region tag, at least three ingredients, at least two preparation steps, and one cover image.
2. THE App SHALL provide a Recipe Creator Studio interface with rich-text step editing, ingredient quantity fields, and image/video upload per step.
3. WHEN a User submits a Recipe, THE App SHALL queue the Recipe for Content_Moderator review before publishing it publicly.
4. WHEN a Recipe passes Content_Moderator review, THE App SHALL publish the Recipe and notify the submitting User.
5. IF a Recipe fails Content_Moderator review, THEN THE App SHALL notify the submitting User with a reason and allow the User to edit and resubmit.
6. THE App SHALL allow Users to mark a submitted Recipe as a "Family/Grandmother Recipe" with a special badge displayed on the Recipe card.
7. THE App SHALL allow Users to edit or delete their own submitted Recipes at any time.

---

### Requirement 5: Recipe Search and Discovery

**User Story:** As a user, I want fast, intelligent search across all recipes, so that I can find exactly what I'm looking for even with partial or misspelled queries.

#### Acceptance Criteria

1. THE Search_Engine SHALL return Recipe results within 200ms for any query string of up to 200 characters.
2. THE Search_Engine SHALL support typo-tolerant matching, returning relevant results for queries with up to two character errors.
3. THE App SHALL support filtering search results by Region, dietary tag, preparation time, ingredient, and rating.
4. THE App SHALL support semantic search using pgvector, returning conceptually related Recipes when no exact keyword match exists.
5. WHEN a User types in the search bar, THE App SHALL display autocomplete suggestions after the User has entered 2 or more characters.
6. THE App SHALL index all Recipe titles, ingredient names, Region names, and dietary tags in the Search_Engine.

---

### Requirement 6: Ratings and Comments

**User Story:** As a community member, I want to rate recipes and share how they turned out, so that others can benefit from real cooking experiences.

#### Acceptance Criteria

1. WHEN a User submits a rating, THE App SHALL accept a value between 1 and 5 stars and store one rating per User per Recipe.
2. THE App SHALL display the average rating and total rating count on each Recipe card and detail page.
3. WHEN a User submits a comment on a Recipe, THE App SHALL allow text up to 2000 characters and optionally one attached video (maximum 100MB, MP4/MOV format).
4. THE App SHALL display comments in chronological order with the most recent comment shown first.
5. WHEN a User submits a comment, THE App SHALL queue the comment for Content_Moderator review before displaying it publicly.
6. THE App SHALL allow Users to delete their own comments at any time.
7. IF a User attempts to submit more than one rating for the same Recipe, THEN THE App SHALL update the existing rating rather than creating a duplicate.

---

### Requirement 7: Social Feed

**User Story:** As a food enthusiast, I want an Instagram-style feed where I can share food reviews and discover what others are cooking, so that I feel part of a global culinary community.

#### Acceptance Criteria

1. THE Social_Feed SHALL display posts from Users the current User follows, sorted by recency.
2. WHEN a User creates a Social_Feed post, THE App SHALL allow: text caption up to 500 characters, up to 10 images, one video (maximum 200MB), and optional Recipe tags.
3. THE App SHALL allow Users to like, comment on, and share Social_Feed posts.
4. THE App SHALL allow Users to follow and unfollow other Users.
5. WHEN a User tags a Recipe in a Social_Feed post, THE App SHALL display a tappable link to that Recipe's detail page.
6. THE App SHALL provide a "Discover" tab in the Social_Feed showing trending posts from all Users, ranked by engagement score (likes + comments + shares) within the past 7 days.
7. WHEN a Social_Feed post is submitted, THE App SHALL queue the post for Content_Moderator review before displaying it publicly.

---

### Requirement 8: AI Recipe Fixer

**User Story:** As a cook who made a mistake, I want AI-powered suggestions to fix or balance my dish, so that I don't have to throw it away.

#### Acceptance Criteria

1. WHEN a User describes a cooking problem (e.g., "too much salt", "too sweet for a diabetic"), THE Recipe_Fixer SHALL return at least three actionable suggestions to correct or balance the dish within 5 seconds.
2. THE Recipe_Fixer SHALL accept natural language input up to 1000 characters describing the problem and the dish.
3. THE Recipe_Fixer SHALL use the Gemini API to generate contextually relevant suggestions based on the dish type, ingredients mentioned, and the described problem.
4. WHERE a User has a premium subscription, THE App SHALL allow unlimited Recipe_Fixer queries per day.
5. WHERE a User is on a free trial or free tier, THE App SHALL limit Recipe_Fixer usage to 5 queries per day.
6. IF the Gemini API returns an error or times out, THEN THE Recipe_Fixer SHALL display a descriptive error message and invite the User to retry.
7. THE App SHALL log each Recipe_Fixer query and response for quality improvement purposes, with User data anonymized.

---

### Requirement 9: Dish Scanner (Image-to-Nutrition)

**User Story:** As a health-conscious user, I want to photograph my food and get nutritional information, so that I can track what I'm eating.

#### Acceptance Criteria

1. WHEN a User uploads a food image, THE Dish_Scanner SHALL identify the dish using the YOLOv8 model and return the dish name, estimated Region of origin, and nutritional breakdown (calories, protein, carbohydrates, fat) within 10 seconds.
2. THE Dish_Scanner SHALL accept images in JPEG, PNG, and WEBP formats up to 10MB in size.
3. IF the Dish_Scanner cannot identify a dish with confidence above 60%, THEN THE App SHALL display a "Could not identify dish" message and offer the User the option to search manually.
4. THE App SHALL display nutritional estimates with a disclaimer that values are approximate and based on standard regional portion sizes.
5. THE App SHALL allow Users to link a Dish_Scanner result to an existing Recipe in the database.

---

### Requirement 10: Audio Recipes and Offline Audio Guide

**User Story:** As a cook with my hands busy, I want to listen to recipe instructions hands-free, so that I can cook without looking at my screen.

#### Acceptance Criteria

1. WHEN a User activates the Audio_Guide for a Recipe, THE App SHALL begin narrating the step-by-step instructions using AI voice synthesis.
2. THE Audio_Guide SHALL support playback controls: play, pause, skip to next step, and repeat current step.
3. THE Audio_Guide SHALL narrate instructions in the User's preferred language.
4. WHERE a User has a premium subscription, THE App SHALL allow the User to download the Audio_Guide for a Recipe for offline playback.
5. IF an Audio_Guide download fails due to a network error, THEN THE App SHALL display a descriptive error and allow the User to retry the download.

---

### Requirement 11: Culinary Academy (Learning Section)

**User Story:** As someone learning to cook, I want structured cooking and gardening lessons, so that I can build skills progressively.

#### Acceptance Criteria

1. THE Culinary_Academy SHALL organize lessons into courses, where each course contains an ordered list of lessons.
2. WHEN a User completes a lesson, THE App SHALL mark the lesson as complete and update the User's course progress percentage.
3. THE Culinary_Academy SHALL support two lesson categories: cooking techniques and home gardening for culinary herbs and vegetables.
4. WHEN a User completes all lessons in a course, THE App SHALL award the User a digital completion badge displayed on the User's profile.
5. THE App SHALL allow Users to bookmark lessons for later access.
6. WHERE a User has a premium subscription, THE App SHALL grant access to all Culinary_Academy courses without restriction.
7. WHERE a User is on a free tier, THE App SHALL grant access to the first lesson of each course only.

---

### Requirement 12: Marketplace (Local Ingredient Sourcing)

**User Story:** As a cook who wants authentic ingredients, I want to find local suppliers for regional ingredients, so that I can source what I need to make authentic dishes.

#### Acceptance Criteria

1. THE Marketplace SHALL display ingredient listings with supplier name, ingredient name, Region of origin, price, unit, and availability status.
2. WHEN a User views a Recipe, THE App SHALL display a "Find Ingredients" shortcut that filters the Marketplace by the Recipe's key ingredients.
3. THE App SHALL allow verified suppliers to create and manage ingredient listings.
4. WHEN a User clicks a Marketplace listing, THE App SHALL display the supplier's contact information or redirect to the supplier's external ordering page.
5. THE App SHALL allow Users to filter Marketplace listings by Region, ingredient category, and availability.
6. IF a Marketplace listing's availability status is "out of stock", THEN THE App SHALL display the listing with a clear "Out of Stock" indicator and disable the order action.

---

### Requirement 13: Subscription and Paywall

**User Story:** As a product owner, I want a subscription model with a 30-day free trial and Razorpay autopay, so that the platform is financially sustainable.

#### Acceptance Criteria

1. THE Subscription_Service SHALL grant every new User a 30-day free trial with access to all premium features, recording `trial_start_date` and `subscription_status = "trial"` in the database.
2. WHEN a User's free trial expires, THE App SHALL display the Paywall and restrict access to premium features until the User subscribes.
3. THE Paywall SHALL use a glassmorphism design and display the premium value proposition (e.g., "Unlock Grandmother's Secret Recipes") with a clear call-to-action to subscribe.
4. WHEN a User initiates a subscription, THE Subscription_Service SHALL create a Razorpay subscription with autopay enabled and redirect the User to the Razorpay checkout flow.
5. WHEN the Webhook_Handler receives a `subscription.activated` event from Razorpay, THE App SHALL update the User's `subscription_status` to `"active"` and set `is_premium = true` in the database.
6. WHEN the Webhook_Handler receives a `subscription.charged` event from Razorpay, THE App SHALL record the payment and extend the User's subscription period accordingly.
7. WHEN the Webhook_Handler receives a `subscription.cancelled` or `payment.failed` event from Razorpay, THE App SHALL update the User's `subscription_status` to `"cancelled"` or `"payment_failed"` respectively and restrict premium access.
8. THE Webhook_Handler SHALL verify the Razorpay webhook signature on every incoming event before processing it.
9. IF the Webhook_Handler receives an event with an invalid signature, THEN THE Webhook_Handler SHALL reject the request with HTTP 400 and log the attempt.
10. THE App SHALL display the User's current subscription status, next billing date, and a cancellation option on the User's profile page.
11. Premium features SHALL include: unlimited AI Recipe_Fixer queries, ad-free Tastes of the World Map, offline Audio_Guide downloads, and full Culinary_Academy access.

---

### Requirement 14: Multi-Language Support

**User Story:** As a non-English speaker, I want to read recipes in my own language, so that I can follow instructions without a language barrier.

#### Acceptance Criteria

1. THE App SHALL support a minimum of 10 languages at launch, including English, Spanish, French, Hindi, Arabic, Portuguese, Mandarin Chinese, Japanese, German, and Italian.
2. WHEN a User selects a preferred language in settings, THE App SHALL apply that language to all UI labels, navigation, and Recipe content.
3. WHEN the Translation_Service is used to translate a Recipe, THE App SHALL cache the translated content in the database to avoid redundant translation requests.
4. THE App SHALL display Recipe content in both the Region's original language and the User's preferred language simultaneously on the Recipe detail page.
5. IF the Translation_Service is unavailable, THEN THE App SHALL display the Recipe in English as a fallback and notify the User that translation is temporarily unavailable.
6. THE Translation_Service SHALL use LibreTranslate for all translation operations.

---

### Requirement 15: Content Moderation

**User Story:** As a platform operator, I want all user-generated content reviewed before publication, so that the community remains safe and respectful.

#### Acceptance Criteria

1. THE Content_Moderator SHALL review all user-submitted Recipes, comments, and Social_Feed posts before they are displayed publicly.
2. THE App SHALL provide an automated pre-screening step that flags content containing prohibited keywords or explicit imagery before human review.
3. WHEN content is flagged by automated pre-screening, THE Content_Moderator SHALL place the content in a manual review queue.
4. THE App SHALL allow any User to report a published Recipe, comment, or Social_Feed post for policy violations.
5. WHEN a report is submitted, THE App SHALL add the reported content to the Content_Moderator review queue within 1 minute.
6. WHEN content is removed by the Content_Moderator, THE App SHALL notify the content author with a reason for removal.

---

### Requirement 16: User Profile

**User Story:** As a user, I want a profile page that showcases my culinary activity, so that others can discover my recipes and follow my food journey.

#### Acceptance Criteria

1. THE App SHALL display on each User's profile: display name, avatar, bio, follower count, following count, submitted Recipes, Social_Feed posts, earned badges, and saved Recipes.
2. THE App SHALL allow Users to edit their display name, avatar, bio, and preferred language at any time.
3. THE App SHALL allow Users to set their profile visibility to public or private.
4. WHILE a User's profile is set to private, THE App SHALL restrict profile content visibility to approved followers only.
5. THE App SHALL display a "Culinary Passport" section on the User's profile showing a map of all Regions whose Recipes the User has cooked or saved.

---

### Requirement 17: Notifications

**User Story:** As a user, I want to receive relevant notifications, so that I stay engaged with the community and my content.

#### Acceptance Criteria

1. THE App SHALL send in-app notifications for: new followers, likes and comments on the User's posts, Recipe approval or rejection, subscription status changes, and new lessons in enrolled courses.
2. THE App SHALL allow Users to configure notification preferences, enabling or disabling each notification category independently.
3. WHEN a subscription payment fails, THE App SHALL send both an in-app notification and an email to the User within 5 minutes of the Webhook_Handler receiving the `payment.failed` event.

---

### Requirement 18: Performance and Reliability

**User Story:** As a user, I want the App to be fast and reliable, so that I have a smooth experience regardless of my connection quality.

#### Acceptance Criteria

1. THE App SHALL load the initial home feed within 3 seconds on a standard broadband connection (10 Mbps).
2. THE App SHALL serve all static assets (images, fonts, icons) via a CDN.
3. THE App SHALL implement pagination or infinite scroll for all list views, loading a maximum of 20 items per page.
4. IF a backend service is unavailable, THEN THE App SHALL display a user-friendly error page and log the failure with a timestamp and service identifier.
5. THE App SHALL achieve a Lighthouse performance score of 80 or above on desktop.

---

### Requirement 19: Security

**User Story:** As a user, I want my data and account to be secure, so that I can trust the platform with my personal information.

#### Acceptance Criteria

1. THE App SHALL store all User passwords using bcrypt with a minimum cost factor of 12.
2. THE App SHALL enforce HTTPS for all client-server communication.
3. THE App SHALL implement rate limiting on authentication endpoints, allowing a maximum of 10 failed login attempts per IP address per 15-minute window before temporarily blocking further attempts.
4. THE App SHALL sanitize all user-supplied input before storing it in the database to prevent SQL injection and XSS attacks.
5. THE Webhook_Handler SHALL verify Razorpay webhook signatures using HMAC-SHA256 before processing any payment event.
6. THE App SHALL implement CORS policies restricting API access to approved origins only.
