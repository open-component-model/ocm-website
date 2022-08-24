package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"golang.org/x/exp/slices"

	"github.com/open-component-model/ocm/cmds/ocm/app"
	"github.com/open-component-model/ocm/pkg/contexts/clictx"
	"github.com/spf13/cobra"
)

var commandsToDocument = []string{
	"add",
	"bootstrap",
	"clean",
	"create",
	"describe",
	"download",
	"get",
	"show",
	"sign",
	"transfer",
	"verify",
}

func main() {
	var outputDir, urlPrefix string

	flag.StringVar(&outputDir, "output-dir", "./content/en/docs/cli-reference", "output directory for generated docs")
	flag.StringVar(&urlPrefix, "url-prefix", "/docs/cli-reference/", "prefix for cli docs urls")

	flag.Parse()

	if outputDir == "" {
		log.Fatal("Flag -output-dir is required")
	}

	if err := run(outputDir, urlPrefix); err != nil {
		log.Fatal(err)
	}
}

func run(dir, urlPrefix string) error {
	log.Println("Generating docs for OCM CLI")

	if err := os.RemoveAll(dir); err != nil {
		return fmt.Errorf("error clearing output directory: %w", err)
	}

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("error creating output directory: %w", err)
	}

	cmd := app.NewCliCommand(clictx.DefaultContext())
	cmd.DisableAutoGenTag = true

	for _, subCmd := range cmd.Commands() {
		if !shouldDocument(subCmd) {
			cmd.RemoveCommand(subCmd)
		}
	}

	if err := genMarkdownTreeCustom(cmd, dir, urlPrefix, "cli-reference"); err != nil {
		return fmt.Errorf("error generating markdown: %w", err)
	}

	log.Printf("Docs successfully written to %s\n", dir)

	return nil
}

func shouldDocument(cmd *cobra.Command) bool {
	if slices.Contains(commandsToDocument, cmd.Name()) {
		return true
	}

	return false
}
