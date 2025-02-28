import { useEffect, useState } from 'react';

import { Activity } from '../types/Activity';

import '../css/ActivityTable.css';

const fetchActivities = async (): Promise<Activity[]> => {
	try {
		const response = await fetch('https://opentdb.com/api.php?amount=20');
		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			throw new Error(`Error fetching data: ${response.status} - ${errorText}`);
		}

		const { results } = await response.json();
		return results;
	} catch (error) {
		console.error('Error fetching trivia questions:', error);
		throw error;
	}
};

const downloadAsJSON = (data: Activity[]) => {
	try {
		const jsonString = JSON.stringify(data, null, 2);
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'trivia_questions.json';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Error downloading JSON:', error);
		alert('Failed to download JSON file. Please try again.');
	}
};

const downloadAsCSV = (data: Activity[]) => {
	try {
		// Create headers
		const headers = Object.keys(data[0]).join(',');

		// Create rows
		const rows = data.map((item) => {
			const values = Object.entries(item).map(([key, value]) => {
				if (key === 'incorrect_answers' && Array.isArray(value)) {
					return `"${value.join(';').replace(/"/g, '""')}"`;
				}
				return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
			});
			return values.join(',');
		});

		const csvContent = [headers, ...rows].join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'trivia_questions.csv';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Error downloading CSV:', error);
		alert('Failed to download CSV file. Please try again.');
	}
};

// Function to print data to console
const printToConsole = (data: Activity[]) => {
	try {
		console.table(data);
		console.log('Trivia data printed to console successfully!');
	} catch (error) {
		console.error('Error printing to console:', error);
		alert('Failed to print data to console. Please check browser console permissions.');
	}
};

const ActivityTable = () => {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadActivities = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await fetchActivities();
			setActivities(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An unknown error occurred');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadActivities();
	}, []);

	if (loading) return <div className='loading'>Loading trivia questions...</div>;
	if (error) {
		return (
			<div className='error-container'>
				<div className='error'>Error: {error}</div>
				<button className='action-button refresh-button' onClick={loadActivities}>
					Try Again
				</button>
			</div>
		);
	}
	if (activities.length === 0)
		return <div className='empty'>No trivia questions found</div>;

	// Function to decode HTML entities
	const decodeHTML = (html: string) => {
		const textarea = document.createElement('textarea');
		textarea.innerHTML = html;
		return textarea.value;
	};

	return (
		<div className='activity-container'>
			<div className='header-actions'>
				<h2>Trivia Questions</h2>
				<button
					className='action-button refresh-button'
					onClick={loadActivities}
					disabled={loading}
				>
					{loading ? 'Loading...' : 'Get New Questions'}
				</button>
			</div>

			<div className='action-buttons'>
				<button
					className='action-button json-button'
					onClick={() => downloadAsJSON(activities)}
				>
					Download JSON
				</button>
				<button
					className='action-button csv-button'
					onClick={() => downloadAsCSV(activities)}
				>
					Download CSV
				</button>
				<button
					className='action-button console-button'
					onClick={() => printToConsole(activities)}
				>
					Print to Console
				</button>
			</div>

			<table className='activity-table'>
				<thead>
					<tr>
						<th>Category</th>
						<th>Question</th>
						<th>Difficulty</th>
						<th>Correct Answer</th>
						<th>Incorrect Answers</th>
					</tr>
				</thead>
				<tbody>
					{activities.map((activity, index) => (
						<tr key={index}>
							<td>{decodeHTML(activity.category)}</td>
							<td>{decodeHTML(activity.question)}</td>
							<td>{activity.difficulty}</td>
							<td>{decodeHTML(activity.correct_answer)}</td>
							<td>
								{activity.incorrect_answers
									.map((answer) => decodeHTML(answer))
									.join(', ')}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default ActivityTable;
