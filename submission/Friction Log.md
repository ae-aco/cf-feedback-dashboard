# Friction Log

### Successful Deployment Feedback

**Problem:** When I ran `npx wrangler deploy` it happened very smoothly and I wasn't sure what I needed to do next. I expected to create a custom URL, instead I was allocated a url automatically. The speed of deployment is a good thing, but the lack of feedback to confirm that it was successful made me second-guess if it had worked properly. I had to navigate to the dashboard to confirm the deployment was live.

**Suggestion:** Improve the success message with "Deployment successful" or even "Done". A prompt to the next steps such as "Test your URL" or "Visit the dashboard to configure settings".
<br>
<br>

### Clarity on Database Error Messages 

**Problem:** When running the schema setup D1 `npx wrangler d1 execute feedback-db --remote --file=./schema.sql`, I received the error message: " x ERROR index idx_source already exists: SQLITE_ERROR". I was unsure if I should investigate if there was an issue with my database, was it corrupted, did I need to drop and recreate the database? I had to seek assistance to understand this issue

**Suggestion:** Perhaps change the word from "Error" to "Warning", it's helpful to know that the database already exists, it should say that it's "Ready to use" so that I don't assume that something is broken. Or change the colour of the error label to orange so that the user understands the severity level of the error. In addition to this, add to the documentation that re-running schema files is common.
<br>
<br>

### Workers & Pages Dashboard 

**Problem:** n/a, this is positive feedback!

**Observation**: As a new user exploring the Workers & Pages dashboard, I found the UI easy to navigate, intuitive and clean. I found it easy to locate key information metrics, deployments, bindings, settings etc. I appreciated that these sections can be found in top level navigation rather than nested in the sidebar menu. This makes key information immediately accessible. 

The `recents` section in the navigation menu on the left is useful as a new user finding their way around the dashboard. Having access to this feature, saves time and reduces the frustration of trying to remember where I found something earlier. 

**Suggestion:** A dashboard for new users (who may not necessarily be part of an organisation, would be a 'Get Started' widget or a guided tour on the website, with a brief explanation of what each section does.

