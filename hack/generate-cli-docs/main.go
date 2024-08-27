package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"slices"
	"strings"

	clictx "ocm.software/ocm/api/cli"
	"ocm.software/ocm/cmds/ocm/app"
)

var commandDenyList = []string{
	"bootstrap",
	"cache",
	"completion",
	"controller",
	"credentials",
	"execute",
	"hash",
	"help",
	"install",
	"oci",
	"ocm",
	"toi",
	"version",
}

func main() {
	var outputDir, urlPrefix string

	flag.StringVar(&outputDir, "output-dir", "./content/docs/cli-reference", "output directory for generated docs")
	flag.StringVar(&urlPrefix, "url-prefix", "/docs/cli-reference", "prefix for cli docs urls")

	flag.Parse()

	if outputDir == "" {
		log.Fatal("Flag -output-dir is required")
	}

	if err := run(outputDir, urlPrefix); err != nil {
		log.Fatal(err)
	}
}

func run(dir, urlPrefix string) error {
	if !strings.HasSuffix(urlPrefix, "/") {
		urlPrefix += "/"
	}

	log.Println("Generating docs for OCM CLI")

	if err := os.RemoveAll(dir); err != nil {
		return fmt.Errorf("error clearing output directory: %w", err)
	}

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("error creating output directory: %w", err)
	}

	cmd := app.NewCliCommand(clictx.DefaultContext())

	for _, subCmd := range cmd.Commands() {
		if slices.Contains(commandDenyList, subCmd.Name()) {
			cmd.RemoveCommand(subCmd)
		}
	}

	if err := genMarkdownTreeCustom(cmd, dir, urlPrefix, "cli-reference"); err != nil {
		return fmt.Errorf("error generating markdown: %w", err)
	}

	if err := genIndexForRootHelpTopics(filepath.Join(dir, "help"), urlPrefix); err != nil {
		return fmt.Errorf("error generating ocm index: %w", err)
	}

	log.Printf("Docs successfully written to %s\n", dir)

	return nil
}
