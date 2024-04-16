package main

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func genIndexForHelpTopics(dir string, urlBase string) (err error) {
	var topics []string
	if err := filepath.Walk(dir, func(path string, info fs.FileInfo, err error) error {
		if !info.IsDir() {
			topics = append(topics, strings.TrimSuffix(filepath.Base(path), ".md"))
		}

		return nil
	}); err != nil {
		return fmt.Errorf("failed to gather help topics: %w", err)
	}

	filename := filepath.Join(dir, "_index.md")

	f, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create index file %q: %v", filename, err)
	}
	defer func() {
		if cerr := f.Close(); cerr != nil {
			err = errors.Join(err, cerr)
		}
	}()
	now := time.Now().Format(time.RFC3339)

	f.WriteString(fmt.Sprintf(fmTmpl, "help", "help", urlBase, now))
	f.WriteString("### Additional Topics\n")

	// * [ocm download <b>artifacts</b>](/docs/cli/cli-reference/download/artifacts)	 &mdash; download oci artifacts
	for _, topic := range topics {
		f.WriteString(fmt.Sprintf("* [%s](%s)\n", topic, urlBase+topic))
	}

	return nil
}
