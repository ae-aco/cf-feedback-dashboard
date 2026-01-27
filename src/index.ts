interface FeedbackItem {
	id: number;
	source: string;
	content: string;
	sentiment: string;
	themes: string;
	urgency: string;
	created_at: string;
}

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
		<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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

		<!-- Feedback List -->
		<section>
			<h2 class="text-xl font-semibold text-gray-900 mb-4">All Feedback</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				${feedback.map(item => renderFeedbackCard(item)).join('')}
			</div>
		</section>
	</div>
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

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;
