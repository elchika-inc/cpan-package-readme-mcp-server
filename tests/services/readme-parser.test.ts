import { describe, it, expect, beforeEach } from 'vitest';
import { ReadmeParser } from '../../src/services/readme-parser.js';

describe('ReadmeParser', () => {
  let parser: ReadmeParser;

  beforeEach(() => {
    parser = new ReadmeParser();
  });

  describe('parseUsageExamples', () => {
    it('should parse examples from SYNOPSIS section', () => {
      const podContent = `
=head1 NAME

DBI - Database independent interface for Perl

=head1 SYNOPSIS

  use DBI;
  
  my $dbh = DBI->connect("dbi:SQLite:dbname=test.db");
  my $sth = $dbh->prepare("SELECT * FROM users");
  $sth->execute();

=head1 DESCRIPTION

This is a test module.
`;

      const examples = parser.parseUsageExamples(podContent);

      expect(examples.length).toBeGreaterThanOrEqual(1);
      const synopsisExample = examples.find(ex => ex.title === 'Synopsis' || ex.code.includes('use DBI;'));
      expect(synopsisExample).toBeDefined();
      expect(synopsisExample!.code).toMatch(/use DBI;|DBI->connect/);
      expect(synopsisExample!.language).toBe('perl');
    });

    it('should parse examples from EXAMPLES section', () => {
      const podContent = `
=head1 NAME

Test Module

=head1 EXAMPLES

=head2 Basic Usage

  use Test::Module;
  my $obj = Test::Module->new();
  $obj->do_something();

=head2 Advanced Usage

  my $result = $obj->advanced_method({
    param1 => 'value1',
    param2 => 'value2'
  });

=head1 DESCRIPTION

This is a test module.
`;

      const examples = parser.parseUsageExamples(podContent);

      expect(examples.length).toBeGreaterThanOrEqual(1);
      
      // Look for any example that contains the expected code
      const basicExample = examples.find(ex => ex.code.includes('Test::Module->new()'));
      expect(basicExample).toBeDefined();
      expect(basicExample!.code).toContain('Test::Module->new()');
      
      const advancedExample = examples.find(ex => ex.code.includes('advanced_method'));
      expect(advancedExample).toBeDefined();
      expect(advancedExample!.code).toContain('advanced_method');
    });

    it('should handle empty POD content', () => {
      const examples = parser.parseUsageExamples('');
      expect(examples).toHaveLength(0);
    });

    it('should handle malformed POD content', () => {
      const examples = parser.parseUsageExamples('This is not valid POD content');
      expect(examples).toHaveLength(0);
    });

    it('should extract code blocks from general content', () => {
      const podContent = `
=head1 NAME

Test Module

=head1 DESCRIPTION

This module provides functionality for testing.

  my $var = 'test';
  print $var;

More description here.

  use Test::Module;
  my $obj = Test::Module->new();

=head1 METHODS

Methods are described here.
`;

      const examples = parser.parseUsageExamples(podContent);

      expect(examples.length).toBeGreaterThan(0);
      
      const codeExamples = examples.filter(ex => ex.code.includes('print $var') || ex.code.includes('Test::Module->new()'));
      expect(codeExamples.length).toBeGreaterThan(0);
    });
  });

  describe('extractModuleDescription', () => {
    it('should extract description from NAME section with dash format', () => {
      const podContent = `
=head1 NAME

DBI - Database independent interface for Perl

=head1 SYNOPSIS

Some synopsis here.
`;

      const description = parser.extractModuleDescription(podContent);
      expect(description).toBe('Database independent interface for Perl');
    });

    it('should extract description from NAME section without dash', () => {
      const podContent = `
=head1 NAME

DBI

Database independent interface for Perl

=head1 SYNOPSIS

Some synopsis here.
`;

      const description = parser.extractModuleDescription(podContent);
      expect(description).toBe('Database independent interface for Perl');
    });

    it('should fall back to DESCRIPTION section', () => {
      const podContent = `
=head1 NAME

DBI

=head1 DESCRIPTION

This is a database interface module that provides
a standard way to access databases.

More details here.

=head1 SYNOPSIS

Some synopsis here.
`;

      const description = parser.extractModuleDescription(podContent);
      expect(description).toBe('This is a database interface module that provides a standard way to access databases.');
    });

    it('should return default description if no suitable content found', () => {
      const podContent = `
=head1 SYNOPSIS

Some synopsis here.
`;

      const description = parser.extractModuleDescription(podContent);
      expect(description).toBe('Perl module');
    });

    it('should handle empty content', () => {
      const description = parser.extractModuleDescription('');
      expect(description).toBe('Perl module');
    });
  });

  describe('convertPodToReadme', () => {
    it('should convert POD headings to Markdown', () => {
      const podContent = `
=head1 MAIN HEADING

=head2 Sub Heading

=head3 Sub Sub Heading

=head4 Sub Sub Sub Heading

Some content here.
`;

      const readme = parser.convertPodToReadme(podContent);

      expect(readme).toContain('# MAIN HEADING');
      expect(readme).toContain('## Sub Heading');
      expect(readme).toContain('### Sub Sub Heading');
      expect(readme).toContain('#### Sub Sub Sub Heading');
    });

    it('should convert POD formatting to Markdown', () => {
      const podContent = `
This is I<italic text> and this is B<bold text>.

Here is some C<code text> and a L<link>.
`;

      const readme = parser.convertPodToReadme(podContent);

      expect(readme).toContain('*italic text*');
      expect(readme).toContain('**bold text**');
      expect(readme).toContain('`code text`');
      expect(readme).toContain('link'); // L<> is simplified
    });

    it('should convert indented code blocks', () => {
      const podContent = `
=head1 SYNOPSIS

Here is some code:

  use DBI;
  my $dbh = DBI->connect("dbi:SQLite:test.db");
  $dbh->disconnect();

And some more text.

  my $var = 'test';
  print $var;

End of content.
`;

      const readme = parser.convertPodToReadme(podContent);

      expect(readme).toContain('```perl');
      expect(readme).toContain('use DBI;');
      expect(readme).toContain('my $dbh = DBI->connect');
      expect(readme).toContain('```');
    });

    it('should remove POD directives', () => {
      const podContent = `
=pod

=head1 NAME

Test Module

=over 4

=item * First item

=item * Second item

=back

=cut

Some content here.
`;

      const readme = parser.convertPodToReadme(podContent);

      expect(readme).not.toContain('=pod');
      expect(readme).not.toContain('=over');
      expect(readme).not.toContain('=item');
      expect(readme).not.toContain('=back');
      expect(readme).not.toContain('=cut');
      expect(readme).toContain('# NAME');
    });

    it('should normalize multiple newlines', () => {
      const podContent = `
=head1 NAME

Test Module




=head1 DESCRIPTION

Some description here.



End of content.
`;

      const readme = parser.convertPodToReadme(podContent);

      expect(readme).not.toMatch(/\n{3,}/);
    });

    it('should handle empty content', () => {
      const readme = parser.convertPodToReadme('');
      expect(readme).toBe('');
    });

    it('should handle complex POD with mixed formatting', () => {
      const podContent = `
=head1 NAME

DBI - Database independent interface for Perl

=head1 SYNOPSIS

  use DBI;
  
  my $dsn = "dbi:SQLite:dbname=test.db";
  my $dbh = DBI->connect($dsn) or die $DBI::errstr;
  
  my $sth = $dbh->prepare("SELECT name FROM users WHERE id = ?");
  $sth->execute(42);
  
  while (my $row = $sth->fetchrow_hashref) {
    print "Name: $row->{'name'}\\n";
  }
  
  $dbh->disconnect();

=head1 DESCRIPTION

The B<DBI> module provides a I<database independent> interface for Perl.

It allows you to write C<portable> database applications.

=head2 Features

=over 4

=item * Database independence

=item * Portable SQL

=item * Consistent API

=back

=cut
`;

      const readme = parser.convertPodToReadme(podContent);

      expect(readme).toContain('# NAME');
      expect(readme).toContain('# DESCRIPTION');
      expect(readme).toContain('## Features');
      expect(readme).toContain('**DBI**');
      expect(readme).toContain('*database independent*');
      expect(readme).toContain('`portable`');
      expect(readme).toContain('```perl');
      expect(readme).toContain('use DBI;');
      expect(readme).toContain('```');
      expect(readme).not.toContain('=cut');
    });
  });

  describe('private methods behavior', () => {
    it('should identify Perl code correctly', () => {
      const perlCode = `
use DBI;
my $dbh = DBI->connect("dbi:SQLite:test.db");
my @results = $dbh->selectall_array("SELECT * FROM users");
print $results[0];
`;

      const examples = parser.parseUsageExamples(`
=head1 TEST

Some text here.

${perlCode.split('\n').map(line => '  ' + line).join('\n')}

More text.
`);

      expect(examples.length).toBeGreaterThan(0);
      const perlExample = examples.find(ex => ex.code.includes('use DBI'));
      expect(perlExample).toBeDefined();
    });

    it('should not identify non-Perl code as Perl', () => {
      const nonPerlCode = `
  function test() {
    console.log("Hello World");
    return true;
  }
`;

      const examples = parser.parseUsageExamples(`
=head1 TEST

Some text here.

${nonPerlCode}

More text.
`);

      // Should not identify JavaScript as Perl
      const jsExample = examples.find(ex => ex.code.includes('console.log'));
      expect(jsExample).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', () => {
      const invalidPod = `
=head1 INVALID

This is some invalid POD content with unclosed tags.

=head2 UNCLOSED

  some code here but invalid structure

=head
`;

      const examples = parser.parseUsageExamples(invalidPod);
      expect(examples).toHaveLength(0);
    });

    it('should handle errors in convertPodToReadme', () => {
      // This should not throw an error
      const result = parser.convertPodToReadme(null as any);
      expect(result).toBe('');
    });
  });
});