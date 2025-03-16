import XCTest
import SwiftTreeSitter
import TreeSitterSmith

final class TreeSitterSmithTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_smith())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Smith grammar")
    }
}
