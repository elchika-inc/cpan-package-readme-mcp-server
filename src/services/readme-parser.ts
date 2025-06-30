import { logger } from '../utils/logger.js';
import type { UsageExample } from '../types/index.js';

export class ReadmeParser {
  parseUsageExamples(podContent: string): UsageExample[] {
    const examples: UsageExample[] = [];
    
    try {
      // Look for SYNOPSIS section
      const synopsisExamples = this.extractSynopsisExamples(podContent);
      examples.push(...synopsisExamples);

      // Look for EXAMPLES section
      const exampleSectionExamples = this.extractExampleSectionExamples(podContent);
      examples.push(...exampleSectionExamples);

      // Look for code blocks in the POD
      const codeBlockExamples = this.extractCodeBlockExamples(podContent);
      examples.push(...codeBlockExamples);

      logger.debug(`Parsed ${examples.length} usage examples from POD`);
      return examples;
    } catch (error) {
      logger.warn('Failed to parse usage examples:', error);
      return [];
    }
  }

  private extractSynopsisExamples(podContent: string): UsageExample[] {
    const examples: UsageExample[] = [];
    
    // Look for SYNOPSIS section
    const synopsisMatch = podContent.match(/=head1\s+SYNOPSIS\s*\n([\s\S]*?)(?=\n=head1|\n=cut|$)/i);
    
    if (synopsisMatch) {
      const synopsisContent = synopsisMatch[1].trim();
      
      // Extract code blocks from synopsis
      const codeBlocks = this.extractPodCodeBlocks(synopsisContent);
      
      codeBlocks.forEach((code) => {
        if (code.trim().length > 0) {
          examples.push({
            title: 'Synopsis',
            code: code.trim(),
            language: 'perl',
            description: 'Basic usage example from the module synopsis',
          });
        }
      });
    }

    return examples;
  }

  private extractExampleSectionExamples(podContent: string): UsageExample[] {
    const examples: UsageExample[] = [];
    
    // Look for EXAMPLES section
    const examplesMatch = podContent.match(/=head1\s+EXAMPLES?\s*\n([\s\S]*?)(?=\n=head1|\n=cut|$)/i);
    
    if (examplesMatch) {
      const examplesContent = examplesMatch[1].trim();
      
      // Extract code blocks from examples section
      const codeBlocks = this.extractPodCodeBlocks(examplesContent);
      
      codeBlocks.forEach((code, index) => {
        if (code.trim().length > 0) {
          const title = this.extractExampleTitleFromContext(examplesContent, code) || `Example ${index + 1}`;
          examples.push({
            title,
            code: code.trim(),
            language: 'perl',
            description: this.extractExampleDescriptionFromContext(examplesContent, code),
          });
        }
      });
    }

    return examples;
  }

  private extractCodeBlockExamples(podContent: string): UsageExample[] {
    const examples: UsageExample[] = [];
    
    // Look for indented code blocks (POD format)
    const codeBlockRegex = /^(\s{2,}.*(?:\n\s{2,}.*)*)/gm;
    let match;
    
    while ((match = codeBlockRegex.exec(podContent)) !== null) {
      const code = match[1].replace(/^\s{2,}/gm, '').trim(); // Remove leading whitespace
      
      if (code.length > 10 && this.looksLikePerl(code)) {
        const title = this.extractExampleTitleFromContext(podContent, match[0]) || 'Code Example';
        examples.push({
          title,
          code,
          language: 'perl',
          description: this.extractExampleDescriptionFromContext(podContent, match[0]),
        });
      }
    }

    return examples;
  }

  private extractPodCodeBlocks(content: string): string[] {
    const codeBlocks: string[] = [];
    
    // POD uses indentation for code blocks
    const lines = content.split('\n');
    let currentBlock = '';
    let inCodeBlock = false;
    
    for (const line of lines) {
      if (line.match(/^\s{2,}/)) {
        // This is a code line
        inCodeBlock = true;
        currentBlock += line.replace(/^\s{2,}/, '') + '\n';
      } else if (inCodeBlock) {
        // End of code block
        if (currentBlock.trim()) {
          codeBlocks.push(currentBlock.trim());
        }
        currentBlock = '';
        inCodeBlock = false;
      }
    }
    
    // Don't forget the last block
    if (currentBlock.trim()) {
      codeBlocks.push(currentBlock.trim());
    }
    
    return codeBlocks;
  }

  private extractExampleTitleFromContext(content: string, codeBlock: string): string | undefined {
    const codeIndex = content.indexOf(codeBlock);
    if (codeIndex === -1) {
      return undefined;
    }
    
    // Look for text before the code block
    const beforeCode = content.substring(Math.max(0, codeIndex - 200), codeIndex);
    
    // Look for POD headings
    const headingMatch = beforeCode.match(/=head[234]\s+([^\n]+)\s*$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    
    // Look for text that might be a title
    const lines = beforeCode.split('\n').reverse();
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('=') && trimmed.length < 50) {
        return trimmed;
      }
    }
    
    return undefined;
  }

  private extractExampleDescriptionFromContext(content: string, codeBlock: string): string | undefined {
    const codeIndex = content.indexOf(codeBlock);
    if (codeIndex === -1) {
      return undefined;
    }
    
    // Look for text after the code block
    const afterCode = content.substring(codeIndex + codeBlock.length, codeIndex + codeBlock.length + 300);
    
    const lines = afterCode.split('\n');
    let description = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Stop at POD directives or empty lines
      if (!trimmed || trimmed.startsWith('=')) {
        if (description) {
          break;
        }
        continue;
      }
      
      description += (description ? ' ' : '') + trimmed;
      
      // Stop at a reasonable length
      if (description.length > 200) {
        break;
      }
    }
    
    return description.length > 10 ? description : undefined;
  }

  private looksLikePerl(code: string): boolean {
    // Simple heuristics to identify Perl code
    const perlIndicators = [
      /use\s+\w+/,           // use statements
      /my\s+\$\w+/,          // variable declarations
      /\$\w+/,               // scalar variables
      /@\w+/,                // arrays
      /%\w+/,                // hashes
      /->\w+/,               // method calls
      /\bsub\s+\w+/,         // subroutines
      /print\s+/,            // print statements
    ];
    
    return perlIndicators.some(regex => regex.test(code));
  }

  extractModuleDescription(podContent: string): string {
    // Look for NAME section first
    const nameMatch = podContent.match(/=head1\s+NAME\s*\n([\s\S]*?)(?=\n=head1|\n=cut|$)/i);
    
    if (nameMatch) {
      const nameContent = nameMatch[1].trim();
      
      // NAME section usually has the format "Module::Name - description"
      const descriptionMatch = nameContent.match(/^\s*\S+\s*-\s*(.+)$/m);
      if (descriptionMatch) {
        return descriptionMatch[1].trim();
      }
      
      // If no dash format, take the first substantial line
      const lines = nameContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.match(/^\S+$/)) { // Not just the module name
          return trimmed;
        }
      }
    }
    
    // Fall back to DESCRIPTION section
    const descMatch = podContent.match(/=head1\s+DESCRIPTION\s*\n([\s\S]*?)(?=\n=head1|\n=cut|$)/i);
    
    if (descMatch) {
      const descContent = descMatch[1].trim();
      const firstParagraph = descContent.split('\n\n')[0];
      return firstParagraph.replace(/\s+/g, ' ').trim();
    }
    
    return 'Perl module';
  }

  convertPodToReadme(podContent: string): string {
    if (!podContent) {
      return '';
    }
    
    let readme = podContent;
    
    // Convert POD headings to Markdown
    readme = readme.replace(/=head1\s+(.+)/g, '# $1');
    readme = readme.replace(/=head2\s+(.+)/g, '## $1');
    readme = readme.replace(/=head3\s+(.+)/g, '### $1');
    readme = readme.replace(/=head4\s+(.+)/g, '#### $1');
    
    // Convert POD formatting
    readme = readme.replace(/I<([^>]+)>/g, '*$1*');     // Italic
    readme = readme.replace(/B<([^>]+)>/g, '**$1**');   // Bold
    readme = readme.replace(/C<([^>]+)>/g, '`$1`');     // Code
    readme = readme.replace(/L<([^>]+)>/g, '$1');       // Links (simplified)
    
    // Convert code blocks (indented text)
    const lines = readme.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      if (line.match(/^\s{2,}/)) {
        if (!inCodeBlock) {
          result.push('```perl');
          inCodeBlock = true;
        }
        result.push(line.replace(/^\s{2,}/, ''));
      } else {
        if (inCodeBlock) {
          result.push('```');
          inCodeBlock = false;
        }
        result.push(line);
      }
    }
    
    if (inCodeBlock) {
      result.push('```');
    }
    
    // Remove POD directives
    return result
      .filter(line => !line.match(/^=(?:pod|cut|over|back|item)/))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .trim();
  }
}

export const readmeParser = new ReadmeParser();