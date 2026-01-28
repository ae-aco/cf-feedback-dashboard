interface FeedbackItem {
	id: number;
	source: string;
	content: string;
	sentiment: string;
	themes: string;
	urgency: string;
	created_at: string;
}

interface AiTextGenerationOutput {
	response?: string;
}

interface AiInsights {
	sentimentTrend: string;
	themes: string;
	actions: string;
}

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

function getSentimentColor(sentiment: string): { bg: string; text: string } {
	switch (sentiment?.toLowerCase()) {
		case 'positive':
			return { bg: 'bg-green-100', text: 'text-green-800' };
		case 'negative':
			return { bg: 'bg-red-100', text: 'text-red-800' };
		default:
			return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
	}
}

function getUrgencyColor(urgency: string): { bg: string; text: string } {
	switch (urgency?.toLowerCase()) {
		case 'critical':
			return { bg: 'bg-red-500', text: 'text-white' };
		case 'high':
			return { bg: 'bg-orange-500', text: 'text-white' };
		case 'medium':
			return { bg: 'bg-yellow-400', text: 'text-yellow-900' };
		default:
			return { bg: 'bg-gray-300', text: 'text-gray-700' };
	}
}

function truncate(str: string, maxLength: number): string {
	if (!str) return '';
	return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

function prepareFeedbackSummary(feedback: FeedbackItem[]): string {
	return feedback.map((f, i) => 
		`${i + 1}. [${f.urgency}] [${f.sentiment}] ${f.source}: "${truncate(f.content, 200)}" (Themes: ${f.themes || 'none'})`
	).join('\n');
}

async function generateInsights(env: Env, feedback: FeedbackItem[]): Promise<AiInsights> {
	const feedbackSummary = prepareFeedbackSummary(feedback);
	
	const sentimentCounts = {
		positive: feedback.filter(f => f.sentiment?.toLowerCase() === 'positive').length,
		negative: feedback.filter(f => f.sentiment?.toLowerCase() === 'negative').length,
		neutral: feedback.filter(f => !['positive', 'negative'].includes(f.sentiment?.toLowerCase())).length,
	};

	const sentimentPrompt = `You are analyzing customer feedback data. Here's a summary:
- Total feedback: ${feedback.length}
- Positive: ${sentimentCounts.positive}
- Negative: ${sentimentCounts.negative}
- Neutral/Mixed: ${sentimentCounts.neutral}

Sample feedback:
${feedbackSummary.slice(0, 2000)}

Provide a brief 1-2 sentence summary of the overall sentiment trend. Be specific with percentages and key emotions expressed.`;

	const themesPrompt = `Analyze this customer feedback and identify the top 5 recurring themes:

${feedbackSummary.slice(0, 2000)}

For each theme, provide:
1. Theme name
2. Brief explanation (1 sentence)
3. How many feedback items mention it

Format as a numbered list.`;

	const actionsPrompt = `Based on this customer feedback, recommend 3-5 priority actions:

${feedbackSummary.slice(0, 2000)}

Consider urgency levels and potential business impact. Format as actionable bullet points.`;

	const [sentimentResult, themesResult, actionsResult] = await Promise.all([
		env.AI.run(AI_MODEL, { prompt: sentimentPrompt, max_tokens: 200 }) as Promise<AiTextGenerationOutput>,
		env.AI.run(AI_MODEL, { prompt: themesPrompt, max_tokens: 400 }) as Promise<AiTextGenerationOutput>,
		env.AI.run(AI_MODEL, { prompt: actionsPrompt, max_tokens: 300 }) as Promise<AiTextGenerationOutput>,
	]);

	return {
		sentimentTrend: sentimentResult.response || 'Unable to analyze sentiment',
		themes: themesResult.response || 'Unable to identify themes',
		actions: actionsResult.response || 'Unable to generate recommendations',
	};
}

async function handleChat(env: Env, question: string, feedback: FeedbackItem[]): Promise<string> {
	const feedbackSummary = prepareFeedbackSummary(feedback);
	
	const prompt = `You are a helpful assistant analyzing customer feedback data. Answer the user's question based on this feedback data:

${feedbackSummary.slice(0, 3000)}

User question: ${question}

Provide a helpful, concise answer based on the feedback data above.`;

	const result = await env.AI.run(AI_MODEL, { prompt, max_tokens: 500 }) as AiTextGenerationOutput;
	return result.response || 'Unable to generate response';
}

function renderFeedbackCard(item: FeedbackItem): string {
	const sentimentColors = getSentimentColor(item.sentiment);
	const urgencyColors = getUrgencyColor(item.urgency);
	const themes = item.themes ? item.themes.split(',').map(t => t.trim()) : [];

	return `
		<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
			<div class="flex justify-between items-start mb-3">
				<span class="text-sm font-medium text-gray-500 uppercase tracking-wide">${item.source || 'Unknown'}</span>
				<div class="flex gap-2">
					<span class="${sentimentColors.bg} ${sentimentColors.text} px-2 py-1 rounded-full text-xs font-medium">
						${item.sentiment || 'Unknown'}
					</span>
					<span class="${urgencyColors.bg} ${urgencyColors.text} px-2 py-1 rounded-full text-xs font-medium">
						${item.urgency || 'Low'}
					</span>
				</div>
			</div>
			<p class="text-gray-700 mb-4">${truncate(item.content, 150)}</p>
			<div class="flex flex-wrap gap-2">
				${themes.map(theme => `
					<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">${theme}</span>
				`).join('')}
			</div>
		</div>
	`;
}

function renderDashboard(feedback: FeedbackItem[]): string {
	const total = feedback.length;
	const urgencyCounts = {
		critical: feedback.filter(f => f.urgency?.toLowerCase() === 'critical').length,
		high: feedback.filter(f => f.urgency?.toLowerCase() === 'high').length,
		medium: feedback.filter(f => f.urgency?.toLowerCase() === 'medium').length,
		low: feedback.filter(f => f.urgency?.toLowerCase() === 'low').length,
	};

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Feedback Intelligence Dashboard</title>
	<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
	<div class="max-w-7xl mx-auto px-4 py-8">
		<!-- Header -->
		<header class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Feedback Intelligence Dashboard</h1>
			<p class="text-gray-600 mt-2">Analyze and track customer feedback in real-time</p>
		</header>

		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8" id="stats">
			<div class="bg-white rounded-lg shadow p-6">
				<div class="text-2xl font-bold text-gray-900">${total}</div>
				<div class="text-sm text-gray-500">Total Feedback</div>
			</div>
			<div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
				<div class="text-2xl font-bold text-red-600">${urgencyCounts.critical}</div>
				<div class="text-sm text-gray-500">Critical</div>
			</div>
			<div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
				<div class="text-2xl font-bold text-orange-600">${urgencyCounts.high}</div>
				<div class="text-sm text-gray-500">High</div>
			</div>
			<div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
				<div class="text-2xl font-bold text-yellow-600">${urgencyCounts.medium}</div>
				<div class="text-sm text-gray-500">Medium</div>
			</div>
			<div class="bg-white rounded-lg shadow p-6 border-l-4 border-gray-300">
				<div class="text-2xl font-bold text-gray-600">${urgencyCounts.low}</div>
				<div class="text-sm text-gray-500">Low</div>
			</div>
		</div>

		<!-- AI Insights Section -->
		<section class="mb-8">
			<div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 text-white">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
					<h2 class="text-xl sm:text-2xl font-bold flex items-center">
						<svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
						</svg>
						AI Insights
					</h2>
					<button id="refresh-insights-btn" onclick="loadInsights()" class="hidden bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
						</svg>
						Refresh Insights
					</button>
				</div>
				<div id="ai-insights-content" class="space-y-4 overflow-auto">
					<div class="flex items-center justify-center py-8">
						<button onclick="loadInsights()" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
							Generate AI Insights
						</button>
					</div>
				</div>
			</div>
		</section>

		<!-- Feedback List -->
		<section>
			<h2 class="text-xl font-semibold text-gray-900 mb-4">All Feedback</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				${feedback.map(item => renderFeedbackCard(item)).join('')}
			</div>
		</section>

		<!-- AI Chat Interface -->
		<section class="mt-8">
			<div class="bg-white rounded-lg shadow-lg p-4 sm:p-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
					<h2 class="text-lg sm:text-xl font-semibold text-gray-900">Ask AI About Feedback</h2>
					<button id="clear-chat-btn" onclick="clearChat()" class="hidden bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
						</svg>
						Clear Chat
					</button>
				</div>
				
				<!-- Quick Action Buttons -->
				<div class="flex flex-wrap gap-2 mb-4">
					<button onclick="askQuestion('Show Critical Issues')" class="bg-red-100 text-red-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-200 transition-colors">
						Show Critical Issues
					</button>
					<button onclick="askQuestion('Analyse Sentiment')" class="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors">
						Analyse Sentiment
					</button>
					<button onclick="askQuestion('Top Themes')" class="bg-purple-100 text-purple-700 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-200 transition-colors">
						Top Themes
					</button>
				</div>

				<!-- Chat Input -->
				<div class="flex flex-col sm:flex-row gap-2 mb-4">
					<input 
						type="text" 
						id="chat-input" 
						placeholder="Ask about feedback..." 
						class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						onkeypress="if(event.key === 'Enter') askQuestion()"
					/>
					<button onclick="askQuestion()" class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
						Ask
					</button>
				</div>

				<!-- Chat Response -->
				<div id="chat-response" class="hidden">
					<div class="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
						<div class="text-sm text-gray-500 mb-2">AI Response:</div>
						<div id="chat-response-text" class="text-gray-800 whitespace-pre-wrap break-words"></div>
					</div>
				</div>
			</div>
		</section>
	</div>

	<script>
		let insightsExpanded = {};

		async function loadInsights() {
			const container = document.getElementById('ai-insights-content');
			const refreshBtn = document.getElementById('refresh-insights-btn');
			container.innerHTML = '<div class="flex items-center justify-center py-8"><div class="text-white">Generating insights...</div></div>';
			
			try {
				const response = await fetch('/api/insights', { method: 'POST' });
				const data = await response.json();
				
				const createExpandableSection = (id, title, content) => {
					const isLong = content.length > 300;
					const truncated = isLong ? content.substring(0, 300) + '...' : content;
					const expanded = insightsExpanded[id] || false;
					
					return \`
						<div class="bg-white/10 rounded-lg p-4">
							<h3 class="font-semibold text-base sm:text-lg mb-2">\${title}</h3>
							<div id="\${id}-content" class="text-white/90 whitespace-pre-wrap break-words text-sm sm:text-base">\${expanded ? content : truncated}</div>
							\${isLong ? \`<button onclick="toggleInsight('\${id}', \${!expanded})" class="mt-2 text-white/80 hover:text-white text-sm underline">\${expanded ? 'Read Less' : 'Read More'}</button>\` : ''}
						</div>
					\`;
				};
				
				container.innerHTML = \`
					\${createExpandableSection('sentiment', '📊 Overall Sentiment Trend', data.sentimentTrend)}
					\${createExpandableSection('themes', '🔍 Top 5 Recurring Themes', data.themes)}
					\${createExpandableSection('actions', '✅ Recommended Priority Actions', data.actions)}
				\`;
				
				refreshBtn.classList.remove('hidden');
			} catch (error) {
				container.innerHTML = '<div class="text-white">Error loading insights. Please try again.</div>';
			}
		}

		function toggleInsight(id, expand) {
			insightsExpanded[id] = expand;
			loadInsights();
		}

		async function askQuestion(predefinedQuestion) {
			const input = document.getElementById('chat-input');
			const responseDiv = document.getElementById('chat-response');
			const responseText = document.getElementById('chat-response-text');
			const clearBtn = document.getElementById('clear-chat-btn');
			
			const question = predefinedQuestion || input.value.trim();
			if (!question) return;
			
			if (!predefinedQuestion) input.value = '';
			
			responseDiv.classList.remove('hidden');
			responseText.textContent = 'Thinking...';
			clearBtn.classList.remove('hidden');
			
			try {
				const response = await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ question })
				});
				const data = await response.json();
				responseText.textContent = data.response;
				responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			} catch (error) {
				responseText.textContent = 'Error getting response. Please try again.';
			}
		}

		function clearChat() {
			const input = document.getElementById('chat-input');
			const responseDiv = document.getElementById('chat-response');
			const responseText = document.getElementById('chat-response-text');
			const clearBtn = document.getElementById('clear-chat-btn');
			
			input.value = '';
			responseText.textContent = '';
			responseDiv.classList.add('hidden');
			clearBtn.classList.add('hidden');
		}
	</script>
</body>
</html>
	`;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/') {
			try {
				const { results } = await env.DB.prepare("SELECT * FROM feedback").all<FeedbackItem>();
				const html = renderDashboard(results || []);
				return new Response(html, {
					headers: { 'Content-Type': 'text/html' },
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				return new Response(`Error fetching feedback: ${errorMessage}`, { status: 500 });
			}
		}

		if (url.pathname === '/api/insights' && request.method === 'POST') {
			try {
				const { results } = await env.DB.prepare("SELECT * FROM feedback").all<FeedbackItem>();
				const insights = await generateInsights(env, results || []);
				return new Response(JSON.stringify(insights), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				return new Response(JSON.stringify({ error: errorMessage }), { 
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		if (url.pathname === '/api/chat' && request.method === 'POST') {
			try {
				const { question } = await request.json() as { question: string };
				if (!question) {
					return new Response(JSON.stringify({ error: 'Question is required' }), { 
						status: 400,
						headers: { 'Content-Type': 'application/json' },
					});
				}
				
				const { results } = await env.DB.prepare("SELECT * FROM feedback").all<FeedbackItem>();
				const response = await handleChat(env, question, results || []);
				return new Response(JSON.stringify({ response }), {
					headers: { 'Content-Type': 'application/json' },
				});
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				return new Response(JSON.stringify({ error: errorMessage }), { 
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
