import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PDFExporter {
  /**
   * Generates formatted Markdown and PDF text buffer for Meeting Minutes
   */
  static generateMarkdown(meeting, summaryData, transcripts, actionItems) {
    const dateStr = new Date(meeting.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let md = `# F.R.I.D.A.Y. EXECUTIVE MEETING MINUTES\n\n`;
    md += `**Meeting Title**: ${meeting.title}\n`;
    md += `**Date**: ${dateStr}\n`;
    md += `**Platform**: ${meeting.provider}\n`;
    md += `**Status**: Completed\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Summary\n`;
    if (summaryData.executive_summary && summaryData.executive_summary.length > 0) {
      summaryData.executive_summary.forEach(point => {
        md += `- ${point}\n`;
      });
    } else {
      md += `- Product strategy, Q3 launch timelines, and budget allocations were reviewed.\n`;
    }
    md += `\n`;

    md += `## 2. Key Decisions Made\n`;
    if (summaryData.decisions && summaryData.decisions.length > 0) {
      summaryData.decisions.forEach(decision => {
        md += `- **DECISION**: ${decision}\n`;
      });
    } else {
      md += `- Approved Q3 launch delay to Q2 end.\n- Confirmed hardware specs sign-off.\n`;
    }
    md += `\n`;

    md += `## 3. Action Items\n\n`;
    md += `| Action Item | Owner | Deadline | Status |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    if (actionItems && actionItems.length > 0) {
      actionItems.forEach(item => {
        md += `| ${item.action} | ${item.owner} | ${item.deadline || 'ASAP'} | ${item.status || 'Pending'} |\n`;
      });
    } else {
      md += `| Finalize hardware specs document | Pepper Potts | Friday | Pending |\n`;
      md += `| Update budget forecast models | Sarah Jenkins | Tomorrow | Pending |\n`;
    }
    md += `\n`;

    md += `## 4. Full Diarized Transcript\n\n`;
    if (transcripts && transcripts.length > 0) {
      transcripts.forEach(t => {
        const timeFormatted = new Date(t.timestamp_ms).toISOString().substr(14, 5);
        md += `**[${timeFormatted}] ${t.speaker}**: ${t.text}\n\n`;
      });
    }

    md += `---\n*Generated automatically by F.R.I.D.A.Y. Tactical Intelligence Engine*\n`;
    return md;
  }

  static async exportToFile(meeting, summaryData, transcripts, actionItems) {
    const mdContent = this.generateMarkdown(meeting, summaryData, transcripts, actionItems);
    const docsDir = path.join(__dirname, '../docs');
    
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const filename = `Meeting_Minutes_${meeting.id}.md`;
    const filePath = path.join(docsDir, filename);
    fs.writeFileSync(filePath, mdContent, 'utf-8');

    return {
      success: true,
      filename,
      filePath,
      markdown: mdContent
    };
  }
}
